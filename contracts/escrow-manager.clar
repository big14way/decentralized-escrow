;; escrow-manager.clar
;; Decentralized P2P Escrow Service with Chainhook-trackable events
;; Uses Clarity 4 features: stacks-block-time, restrict-assets?, to-ascii?
;; Emits print events for: escrow-created, escrow-funded, escrow-released, escrow-disputed, fee-collected

(define-constant CONTRACT_OWNER tx-sender)
(define-data-var contract-principal principal tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u20001))
(define-constant ERR_ESCROW_NOT_FOUND (err u20002))
(define-constant ERR_INVALID_AMOUNT (err u20003))
(define-constant ERR_ESCROW_EXPIRED (err u20004))
(define-constant ERR_ALREADY_FUNDED (err u20005))
(define-constant ERR_NOT_FUNDED (err u20006))
(define-constant ERR_DISPUTE_ACTIVE (err u20007))
(define-constant ERR_INVALID_STATE (err u20008))
(define-constant ERR_ALREADY_ESCALATED (err u20009))
(define-constant ERR_ESCALATION_NOT_ALLOWED (err u20010))
(define-constant ERR_ESCALATION_PERIOD_EXPIRED (err u20011))
(define-constant ERR_PARTIAL_REFUND_EXCEEDS_AMOUNT (err u20012))
(define-constant ERR_NOTHING_TO_REFUND (err u20013))

;; Escrow status
(define-constant STATUS_PENDING u0)
(define-constant STATUS_FUNDED u1)
(define-constant STATUS_RELEASED u2)
(define-constant STATUS_REFUNDED u3)
(define-constant STATUS_DISPUTED u4)
(define-constant STATUS_RESOLVED u5)

;; Protocol fee: 1% (100 basis points)
(define-constant PROTOCOL_FEE_BPS u100)
;; Dispute resolution fee: 2%
(define-constant DISPUTE_FEE_BPS u200)

;; ========================================
;; Data Variables
;; ========================================

(define-data-var escrow-counter uint u0)
(define-data-var total-volume uint u0)
(define-data-var total-fees-collected uint u0)
(define-data-var total-users uint u0)
(define-data-var active-escrows uint u0)
(define-data-var escalation-period uint u259200) ;; 3 days in seconds
(define-data-var total-escalations uint u0)

;; ========================================
;; Data Maps
;; ========================================

(define-map escrows
    uint
    {
        buyer: principal,
        seller: principal,
        amount: uint,
        description: (string-ascii 256),
        created-at: uint,
        expires-at: uint,
        funded-at: (optional uint),
        status: uint,
        dispute-reason: (optional (string-ascii 256)),
        arbiter: (optional principal),
        total-refunded: uint,
        remaining-amount: uint
    }
)

;; User statistics for analytics
(define-map user-stats
    principal
    {
        escrows-created: uint,
        escrows-completed: uint,
        escrows-disputed: uint,
        total-volume: uint,
        fees-paid: uint,
        first-activity: uint,
        last-activity: uint
    }
)

;; Track unique users
(define-map registered-users principal bool)

;; Authorized arbiters
(define-map arbiters principal bool)

;; Dispute escalation tracking
(define-map dispute-escalations
    uint
    {
        escalation-level: uint,
        escalated-at: uint,
        escalated-by: principal,
        escalation-arbiter: (optional principal),
        escalation-reason: (optional (string-ascii 256)),
        escalation-deadline: uint
    }
)

;; Senior arbiters (for escalated disputes)
(define-map senior-arbiters principal bool)

;; ========================================
;; Print Event Structures (for Chainhook)
;; ========================================

;; Events are emitted as print statements that Chainhook can track
;; Format: { event: "event-name", data: { ... } }

;; ========================================
;; Read-Only Functions
;; ========================================

(define-read-only (get-current-time) stacks-block-time)

(define-read-only (get-escrow (escrow-id uint))
    (map-get? escrows escrow-id))

(define-read-only (get-user-stats (user principal))
    (map-get? user-stats user))

(define-read-only (is-arbiter (arbiter principal))
    (default-to false (map-get? arbiters arbiter)))

(define-read-only (calculate-fee (amount uint))
    (/ (* amount PROTOCOL_FEE_BPS) u10000))

(define-read-only (calculate-dispute-fee (amount uint))
    (/ (* amount DISPUTE_FEE_BPS) u10000))

(define-read-only (get-protocol-stats)
    {
        total-escrows: (var-get escrow-counter),
        active-escrows: (var-get active-escrows),
        total-volume: (var-get total-volume),
        total-fees: (var-get total-fees-collected),
        total-users: (var-get total-users),
        current-time: stacks-block-time
    })

;; Generate escrow info message using to-ascii?
(define-read-only (generate-escrow-info (escrow-id uint))
    (match (map-get? escrows escrow-id)
        escrow (let
            (
                (id-str (unwrap-panic (to-ascii? escrow-id)))
                (amount-str (unwrap-panic (to-ascii? (get amount escrow))))
                (status-str (unwrap-panic (to-ascii? (get status escrow))))
            )
            (concat 
                (concat (concat "Escrow #" id-str) (concat " | Amount: " amount-str))
                (concat " | Status: " status-str)))
        "Escrow not found"))

;; ========================================
;; Private Helper Functions
;; ========================================

(define-private (update-user-stats-create (user principal) (amount uint))
    (let
        (
            (current-stats (default-to 
                { escrows-created: u0, escrows-completed: u0, escrows-disputed: u0, 
                  total-volume: u0, fees-paid: u0, first-activity: stacks-block-time, last-activity: u0 }
                (map-get? user-stats user)))
            (is-new-user (is-none (map-get? registered-users user)))
        )
        ;; Register new user
        (if is-new-user
            (begin
                (map-set registered-users user true)
                (var-set total-users (+ (var-get total-users) u1)))
            true)
        ;; Update stats
        (map-set user-stats user (merge current-stats {
            escrows-created: (+ (get escrows-created current-stats) u1),
            total-volume: (+ (get total-volume current-stats) amount),
            last-activity: stacks-block-time
        }))))

(define-private (update-user-stats-complete (user principal) (fees uint))
    (match (map-get? user-stats user)
        stats (map-set user-stats user (merge stats {
            escrows-completed: (+ (get escrows-completed stats) u1),
            fees-paid: (+ (get fees-paid stats) fees),
            last-activity: stacks-block-time
        }))
        false))

;; ========================================
;; Public Functions
;; ========================================

;; Create a new escrow
(define-public (create-escrow 
    (seller principal) 
    (amount uint) 
    (description (string-ascii 256))
    (duration uint))
    (let
        (
            (caller tx-sender)
            (escrow-id (+ (var-get escrow-counter) u1))
            (current-time stacks-block-time)
            (expires-at (+ current-time duration))
        )
        ;; Validations
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)
        (asserts! (> duration u0) ERR_INVALID_AMOUNT)
        
        ;; Create escrow record
        (map-set escrows escrow-id {
            buyer: caller,
            seller: seller,
            amount: amount,
            description: description,
            created-at: current-time,
            expires-at: expires-at,
            funded-at: none,
            status: STATUS_PENDING,
            dispute-reason: none,
            arbiter: none,
            total-refunded: u0,
            remaining-amount: amount
        })
        
        ;; Update counters
        (var-set escrow-counter escrow-id)
        (var-set active-escrows (+ (var-get active-escrows) u1))
        
        ;; Update user stats
        (update-user-stats-create caller amount)
        
        ;; EMIT EVENT: escrow-created (Chainhook will track this)
        (print {
            event: "escrow-created",
            escrow-id: escrow-id,
            buyer: caller,
            seller: seller,
            amount: amount,
            expires-at: expires-at,
            timestamp: current-time
        })
        
        (ok escrow-id)))

;; Fund the escrow (buyer deposits)
(define-public (fund-escrow (escrow-id uint))
    (let
        (
            (caller tx-sender)
            (escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
            (current-time stacks-block-time)
        )
        ;;  Validations
        (asserts! (is-eq caller (get buyer escrow)) ERR_NOT_AUTHORIZED)
        (asserts! (is-eq (get status escrow) STATUS_PENDING) ERR_ALREADY_FUNDED)
        (asserts! (< current-time (get expires-at escrow)) ERR_ESCROW_EXPIRED)

        ;; Transfer funds to contract
        (try! (stx-transfer? (get amount escrow) caller (var-get contract-principal)))

        ;; Update escrow
        (map-set escrows escrow-id (merge escrow {
            funded-at: (some current-time),
            status: STATUS_FUNDED
        }))

        ;; EMIT EVENT: escrow-funded
        (print {
            event: "escrow-funded",
            escrow-id: escrow-id,
            buyer: caller,
            seller: (get seller escrow),
            amount: (get amount escrow),
            timestamp: current-time
        })

        (ok true)))

;; Release escrow to seller (buyer confirms delivery)
(define-public (release-escrow (escrow-id uint))
    (let
        (
            (caller tx-sender)
            (escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
            (current-time stacks-block-time)
            (amount (get amount escrow))
            (fee (calculate-fee amount))
            (seller-amount (- amount fee))
        )
        ;; Only buyer can release
        (asserts! (is-eq caller (get buyer escrow)) ERR_NOT_AUTHORIZED)
        (asserts! (is-eq (get status escrow) STATUS_FUNDED) ERR_NOT_FUNDED)
        
        ;; Transfer to seller (minus fee)
        (try! (stx-transfer? seller-amount (var-get contract-principal) (get seller escrow)))

        ;; Transfer fee to protocol
        (try! (stx-transfer? fee (var-get contract-principal) CONTRACT_OWNER))
        
        ;; Update escrow
        (map-set escrows escrow-id (merge escrow { status: STATUS_RELEASED }))
        
        ;; Update stats
        (var-set active-escrows (- (var-get active-escrows) u1))
        (var-set total-volume (+ (var-get total-volume) amount))
        (var-set total-fees-collected (+ (var-get total-fees-collected) fee))
        (update-user-stats-complete caller fee)
        (update-user-stats-complete (get seller escrow) u0)
        
        ;; EMIT EVENT: escrow-released
        (print {
            event: "escrow-released",
            escrow-id: escrow-id,
            buyer: caller,
            seller: (get seller escrow),
            amount: seller-amount,
            fee: fee,
            timestamp: current-time
        })
        
        ;; EMIT EVENT: fee-collected
        (print {
            event: "fee-collected",
            escrow-id: escrow-id,
            fee-type: "release",
            amount: fee,
            timestamp: current-time
        })
        
        (ok seller-amount)))

;; Refund escrow to buyer (seller cancels or timeout)
(define-public (refund-escrow (escrow-id uint))
    (let
        (
            (caller tx-sender)
            (escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
            (current-time stacks-block-time)
        )
        ;; Can refund if: seller cancels OR escrow expired
        (asserts! (or 
            (is-eq caller (get seller escrow))
            (and (is-eq caller (get buyer escrow)) (> current-time (get expires-at escrow))))
            ERR_NOT_AUTHORIZED)
        (asserts! (is-eq (get status escrow) STATUS_FUNDED) ERR_NOT_FUNDED)
        
        ;; Refund to buyer
        (try! (stx-transfer? (get amount escrow) (var-get contract-principal) (get buyer escrow)))
        
        ;; Update escrow
        (map-set escrows escrow-id (merge escrow { status: STATUS_REFUNDED }))
        (var-set active-escrows (- (var-get active-escrows) u1))
        
        ;; EMIT EVENT: escrow-refunded
        (print {
            event: "escrow-refunded",
            escrow-id: escrow-id,
            buyer: (get buyer escrow),
            seller: (get seller escrow),
            amount: (get amount escrow),
            reason: (if (is-eq caller (get seller escrow)) "seller-cancelled" "expired"),
            timestamp: current-time
        })
        
        (ok true)))

;; Open dispute
(define-public (open-dispute (escrow-id uint) (reason (string-ascii 256)))
    (let
        (
            (caller tx-sender)
            (escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
            (current-time stacks-block-time)
        )
        ;; Either party can dispute
        (asserts! (or (is-eq caller (get buyer escrow)) (is-eq caller (get seller escrow))) ERR_NOT_AUTHORIZED)
        (asserts! (is-eq (get status escrow) STATUS_FUNDED) ERR_NOT_FUNDED)
        
        ;; Update escrow
        (map-set escrows escrow-id (merge escrow {
            status: STATUS_DISPUTED,
            dispute-reason: (some reason)
        }))
        
        ;; Update user dispute count
        (match (map-get? user-stats caller)
            stats (map-set user-stats caller (merge stats {
                escrows-disputed: (+ (get escrows-disputed stats) u1)
            }))
            false)
        
        ;; EMIT EVENT: escrow-disputed
        (print {
            event: "escrow-disputed",
            escrow-id: escrow-id,
            disputer: caller,
            buyer: (get buyer escrow),
            seller: (get seller escrow),
            amount: (get amount escrow),
            reason: reason,
            timestamp: current-time
        })
        
        (ok true)))

;; Resolve dispute (arbiter only)
(define-public (resolve-dispute (escrow-id uint) (winner principal))
    (let
        (
            (caller tx-sender)
            (escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
            (current-time stacks-block-time)
            (amount (get amount escrow))
            (dispute-fee (calculate-dispute-fee amount))
            (winner-amount (- amount dispute-fee))
        )
        ;; Only arbiter can resolve
        (asserts! (or (is-arbiter caller) (is-eq caller CONTRACT_OWNER)) ERR_NOT_AUTHORIZED)
        (asserts! (is-eq (get status escrow) STATUS_DISPUTED) ERR_INVALID_STATE)
        (asserts! (or (is-eq winner (get buyer escrow)) (is-eq winner (get seller escrow))) ERR_NOT_AUTHORIZED)
        
        ;; Transfer to winner (minus dispute fee)
        (try! (stx-transfer? winner-amount (var-get contract-principal) winner))

        ;; Transfer dispute fee to arbiter
        (try! (stx-transfer? dispute-fee (var-get contract-principal) caller))
        
        ;; Update escrow
        (map-set escrows escrow-id (merge escrow {
            status: STATUS_RESOLVED,
            arbiter: (some caller)
        }))
        
        ;; Update stats
        (var-set active-escrows (- (var-get active-escrows) u1))
        (var-set total-volume (+ (var-get total-volume) amount))
        (var-set total-fees-collected (+ (var-get total-fees-collected) dispute-fee))
        
        ;; EMIT EVENT: dispute-resolved
        (print {
            event: "dispute-resolved",
            escrow-id: escrow-id,
            winner: winner,
            loser: (if (is-eq winner (get buyer escrow)) (get seller escrow) (get buyer escrow)),
            amount: winner-amount,
            arbiter: caller,
            arbiter-fee: dispute-fee,
            timestamp: current-time
        })
        
        ;; EMIT EVENT: fee-collected
        (print {
            event: "fee-collected",
            escrow-id: escrow-id,
            fee-type: "dispute",
            amount: dispute-fee,
            timestamp: current-time
        })
        
        (ok winner-amount)))

;; ========================================
;; Admin Functions
;; ========================================

;; Add arbiter
(define-public (add-arbiter (arbiter principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        (map-set arbiters arbiter true)
        
        ;; EMIT EVENT: arbiter-added
        (print {
            event: "arbiter-added",
            arbiter: arbiter,
            timestamp: stacks-block-time
        })
        
        (ok true)))

;; Remove arbiter
(define-public (remove-arbiter (arbiter principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        (map-set arbiters arbiter false)
        (ok true)))

;; ========================================
;; Dispute Escalation Functions
;; ========================================

;; Escalate a dispute to senior arbiter
(define-public (escalate-dispute (escrow-id uint) (escalation-reason (string-ascii 256)))
    (let ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
          (existing-escalation (map-get? dispute-escalations escrow-id)))
        ;; Validations
        (asserts! (is-eq (get status escrow) STATUS_DISPUTED) ERR_INVALID_STATE)
        (asserts! (is-none existing-escalation) ERR_ALREADY_ESCALATED)
        ;; Only buyer, seller, or original arbiter can escalate
        (asserts! (or (is-eq tx-sender (get buyer escrow))
                      (is-eq tx-sender (get seller escrow))
                      (match (get arbiter escrow)
                        assigned-arbiter (is-eq tx-sender assigned-arbiter)
                        false))
                  ERR_NOT_AUTHORIZED)

        ;; Create escalation record
        (map-set dispute-escalations escrow-id {
            escalation-level: u1,
            escalated-at: stacks-block-time,
            escalated-by: tx-sender,
            escalation-arbiter: none,
            escalation-reason: (some escalation-reason),
            escalation-deadline: (+ stacks-block-time (var-get escalation-period))
        })

        ;; Update statistics
        (var-set total-escalations (+ (var-get total-escalations) u1))

        ;; Emit Chainhook event
        (print {
            event: "dispute-escalated",
            escrow-id: escrow-id,
            escalated-by: tx-sender,
            escalation-level: u1,
            reason: escalation-reason,
            timestamp: stacks-block-time
        })
        (ok true)))

;; Assign senior arbiter to escalated dispute
(define-public (assign-senior-arbiter (escrow-id uint) (senior-arbiter principal))
    (let ((escalation (unwrap! (map-get? dispute-escalations escrow-id) ERR_ESCROW_NOT_FOUND)))
        ;; Only contract owner can assign senior arbiters
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        ;; Verify the arbiter is authorized as senior
        (asserts! (default-to false (map-get? senior-arbiters senior-arbiter)) ERR_NOT_AUTHORIZED)
        ;; Check escalation hasn't expired
        (asserts! (< stacks-block-time (get escalation-deadline escalation)) ERR_ESCALATION_PERIOD_EXPIRED)

        ;; Assign the senior arbiter
        (map-set dispute-escalations escrow-id (merge escalation {
            escalation-arbiter: (some senior-arbiter)
        }))

        (print {
            event: "senior-arbiter-assigned",
            escrow-id: escrow-id,
            arbiter: senior-arbiter,
            timestamp: stacks-block-time
        })
        (ok true)))

;; Resolve escalated dispute
(define-public (resolve-escalated-dispute (escrow-id uint) (winner principal))
    (let ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
          (escalation (unwrap! (map-get? dispute-escalations escrow-id) ERR_ESCALATION_NOT_ALLOWED)))
        ;; Only assigned senior arbiter can resolve
        (asserts! (match (get escalation-arbiter escalation)
                    assigned-arbiter (is-eq tx-sender assigned-arbiter)
                    false)
                  ERR_NOT_AUTHORIZED)
        ;; Verify winner is either buyer or seller
        (asserts! (or (is-eq winner (get buyer escrow))
                      (is-eq winner (get seller escrow)))
                  ERR_NOT_AUTHORIZED)

        ;; Calculate fees
        (let ((dispute-fee (/ (* (get amount escrow) DISPUTE_FEE_BPS) u10000))
              (payout (- (get amount escrow) dispute-fee)))

            ;; Transfer funds
            (try! (stx-transfer? payout (var-get contract-principal) winner))
            (var-set total-fees-collected (+ (var-get total-fees-collected) dispute-fee))

            ;; Update escrow status
            (map-set escrows escrow-id (merge escrow {
                status: STATUS_RESOLVED
            }))

            ;; Emit Chainhook event
            (print {
                event: "escalated-dispute-resolved",
                escrow-id: escrow-id,
                winner: winner,
                payout: payout,
                fee: dispute-fee,
                arbiter: tx-sender,
                timestamp: stacks-block-time
            })
            (ok true))))

;; Authorize a senior arbiter
(define-public (authorize-senior-arbiter (arbiter principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        (map-set senior-arbiters arbiter true)
        (print { event: "senior-arbiter-authorized", arbiter: arbiter, by: tx-sender })
        (ok true)))

;; Revoke senior arbiter authorization
(define-public (revoke-senior-arbiter (arbiter principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        (map-set senior-arbiters arbiter false)
        (print { event: "senior-arbiter-revoked", arbiter: arbiter, by: tx-sender })
        (ok true)))

;; Get escalation details
(define-read-only (get-escalation (escrow-id uint))
    (map-get? dispute-escalations escrow-id))

;; Check if dispute can be escalated
(define-read-only (can-escalate (escrow-id uint))
    (match (map-get? escrows escrow-id)
        escrow (and (is-eq (get status escrow) STATUS_DISPUTED)
                   (is-none (map-get? dispute-escalations escrow-id)))
        false))

;; Get escalation statistics
(define-read-only (get-escalation-stats)
    {
        total-escalations: (var-get total-escalations),
        escalation-period: (var-get escalation-period)
    })

;; ========================================
;; Partial Refund Functions
;; ========================================

;; Issue a partial refund (seller can refund part of escrow to buyer)
(define-public (partial-refund (escrow-id uint) (refund-amount uint) (reason (string-ascii 256)))
    (let ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
          (current-time stacks-block-time)
          (new-refunded-total (+ (get total-refunded escrow) refund-amount))
          (new-remaining (- (get remaining-amount escrow) refund-amount)))
        ;; Validations
        (asserts! (is-eq tx-sender (get seller escrow)) ERR_NOT_AUTHORIZED)
        (asserts! (is-eq (get status escrow) STATUS_FUNDED) ERR_NOT_FUNDED)
        (asserts! (> refund-amount u0) ERR_INVALID_AMOUNT)
        (asserts! (<= refund-amount (get remaining-amount escrow)) ERR_PARTIAL_REFUND_EXCEEDS_AMOUNT)
        (asserts! (> (get remaining-amount escrow) u0) ERR_NOTHING_TO_REFUND)

        ;; Transfer partial refund to buyer
        (try! (stx-transfer? refund-amount (var-get contract-principal) (get buyer escrow)))

        ;; Update escrow tracking
        (map-set escrows escrow-id (merge escrow {
            total-refunded: new-refunded-total,
            remaining-amount: new-remaining
        }))

        ;; Emit Chainhook event
        (print {
            event: "partial-refund-issued",
            escrow-id: escrow-id,
            buyer: (get buyer escrow),
            seller: tx-sender,
            refund-amount: refund-amount,
            total-refunded: new-refunded-total,
            remaining-amount: new-remaining,
            reason: reason,
            timestamp: current-time
        })
        (ok new-remaining)))

;; Release remaining escrow amount after partial refunds
(define-public (release-remaining (escrow-id uint))
    (let ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
          (current-time stacks-block-time)
          (remaining (get remaining-amount escrow))
          (fee (calculate-fee remaining))
          (seller-amount (- remaining fee)))
        ;; Validations
        (asserts! (is-eq tx-sender (get buyer escrow)) ERR_NOT_AUTHORIZED)
        (asserts! (is-eq (get status escrow) STATUS_FUNDED) ERR_NOT_FUNDED)
        (asserts! (> remaining u0) ERR_NOTHING_TO_REFUND)

        ;; Transfer remaining amount to seller (minus fee)
        (try! (stx-transfer? seller-amount (var-get contract-principal) (get seller escrow)))
        (try! (stx-transfer? fee (var-get contract-principal) CONTRACT_OWNER))

        ;; Update escrow status
        (map-set escrows escrow-id (merge escrow {
            status: STATUS_RELEASED,
            remaining-amount: u0
        }))

        ;; Update stats
        (var-set active-escrows (- (var-get active-escrows) u1))
        (var-set total-volume (+ (var-get total-volume) (get amount escrow)))
        (var-set total-fees-collected (+ (var-get total-fees-collected) fee))
        (update-user-stats-complete (get buyer escrow) fee)
        (update-user-stats-complete (get seller escrow) u0)

        ;; Emit events
        (print {
            event: "remaining-released",
            escrow-id: escrow-id,
            buyer: (get buyer escrow),
            seller: (get seller escrow),
            amount: seller-amount,
            fee: fee,
            total-refunded: (get total-refunded escrow),
            timestamp: current-time
        })
        (print {
            event: "fee-collected",
            escrow-id: escrow-id,
            fee-type: "release-remaining",
            amount: fee,
            timestamp: current-time
        })
        (ok seller-amount)))

;; Refund all remaining amount (cancellation after partial refunds)
(define-public (refund-remaining (escrow-id uint))
    (let ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
          (current-time stacks-block-time)
          (remaining (get remaining-amount escrow)))
        ;; Validations
        (asserts! (or (is-eq tx-sender (get seller escrow))
                     (and (is-eq tx-sender (get buyer escrow))
                          (> current-time (get expires-at escrow))))
                  ERR_NOT_AUTHORIZED)
        (asserts! (is-eq (get status escrow) STATUS_FUNDED) ERR_NOT_FUNDED)
        (asserts! (> remaining u0) ERR_NOTHING_TO_REFUND)

        ;; Refund remaining to buyer
        (try! (stx-transfer? remaining (var-get contract-principal) (get buyer escrow)))

        ;; Update escrow
        (map-set escrows escrow-id (merge escrow {
            status: STATUS_REFUNDED,
            remaining-amount: u0,
            total-refunded: (+ (get total-refunded escrow) remaining)
        }))
        (var-set active-escrows (- (var-get active-escrows) u1))

        ;; Emit event
        (print {
            event: "remaining-refunded",
            escrow-id: escrow-id,
            buyer: (get buyer escrow),
            seller: (get seller escrow),
            amount: remaining,
            total-refunded: (+ (get total-refunded escrow) remaining),
            reason: (if (is-eq tx-sender (get seller escrow)) "seller-cancelled" "expired"),
            timestamp: current-time
        })
        (ok remaining)))

;; Get refund summary for an escrow
(define-read-only (get-refund-summary (escrow-id uint))
    (match (map-get? escrows escrow-id)
        escrow (some {
            original-amount: (get amount escrow),
            total-refunded: (get total-refunded escrow),
            remaining-amount: (get remaining-amount escrow),
            refund-percentage: (/ (* (get total-refunded escrow) u10000) (get amount escrow))
        })
        none))

;; Community voting for disputes (3 arbiters vote)
(define-map arbiter-votes { escrow-id: uint, arbiter: principal } { vote-for-buyer: bool, voted-at: uint })
(define-map dispute-vote-counts uint { buyer-votes: uint, seller-votes: uint, total-votes: uint })

(define-public (cast-arbiter-vote (escrow-id uint) (vote-for-buyer bool))
    (let ((escrow (unwrap! (map-get? escrows escrow-id) ERR_ESCROW_NOT_FOUND))
          (counts (default-to { buyer-votes: u0, seller-votes: u0, total-votes: u0 } (map-get? dispute-vote-counts escrow-id))))
        (asserts! (is-eq (get status escrow) STATUS_DISPUTED) ERR_INVALID_STATE)
        (asserts! (is-none (map-get? arbiter-votes { escrow-id: escrow-id, arbiter: tx-sender })) ERR_INVALID_STATE)
        (map-set arbiter-votes { escrow-id: escrow-id, arbiter: tx-sender } { vote-for-buyer: vote-for-buyer, voted-at: stacks-block-time })
        (map-set dispute-vote-counts escrow-id {
            buyer-votes: (if vote-for-buyer (+ (get buyer-votes counts) u1) (get buyer-votes counts)),
            seller-votes: (if vote-for-buyer (get seller-votes counts) (+ (get seller-votes counts) u1)),
            total-votes: (+ (get total-votes counts) u1)
        })
        (print { event: "arbiter-vote-cast", escrow-id: escrow-id, arbiter: tx-sender, vote-for-buyer: vote-for-buyer, timestamp: stacks-block-time })
        (ok true)))

(define-read-only (get-vote-results (escrow-id uint))
    (map-get? dispute-vote-counts escrow-id))
