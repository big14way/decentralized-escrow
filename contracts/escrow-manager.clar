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
        arbiter: (optional principal)
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
            arbiter: none
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
(define-data-var escrow-var-1 uint u1)
(define-data-var escrow-var-2 uint u2)
(define-data-var escrow-var-3 uint u3)
(define-data-var escrow-var-4 uint u4)
(define-data-var escrow-var-5 uint u5)
