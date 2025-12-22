;; escrow-arbitration.clar
;; Decentralized arbitration system for escrow disputes
;; Uses Clarity 4 epoch 3.3 with Chainhook integration

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u13001))
(define-constant ERR_DISPUTE_NOT_FOUND (err u13002))
(define-constant ERR_ALREADY_VOTED (err u13003))
(define-constant ERR_VOTING_CLOSED (err u13004))

(define-data-var dispute-counter uint u0)
(define-data-var arbitrator-pool-size uint u0)
(define-data-var voting-period uint u1440)

(define-map disputes
    uint
    {
        escrow-id: uint,
        filed-by: principal,
        respondent: principal,
        reason: (string-utf8 512),
        evidence-hash: (buff 32),
        filed-at: uint,
        voting-ends-at: uint,
        votes-for-plaintiff: uint,
        votes-for-defendant: uint,
        resolved: bool,
        resolution: (optional (string-ascii 16)),
        resolved-at: uint
    }
)

(define-map arbitrators
    principal
    {
        reputation-score: uint,
        cases-judged: uint,
        accuracy-rate: uint,
        active: bool,
        registered-at: uint
    }
)

(define-map arbitrator-votes
    { dispute-id: uint, arbitrator: principal }
    {
        vote: (string-ascii 16),
        reasoning: (string-utf8 256),
        voted-at: uint,
        weight: uint
    }
)

(define-public (file-dispute
    (escrow-id uint)
    (respondent principal)
    (reason (string-utf8 512))
    (evidence-hash (buff 32)))
    (let
        (
            (dispute-id (+ (var-get dispute-counter) u1))
            (voting-ends (+ stacks-block-time (var-get voting-period)))
        )
        (map-set disputes dispute-id {
            escrow-id: escrow-id,
            filed-by: tx-sender,
            respondent: respondent,
            reason: reason,
            evidence-hash: evidence-hash,
            filed-at: stacks-block-time,
            voting-ends-at: voting-ends,
            votes-for-plaintiff: u0,
            votes-for-defendant: u0,
            resolved: false,
            resolution: none,
            resolved-at: u0
        })
        (var-set dispute-counter dispute-id)
        (print {
            event: "dispute-filed",
            dispute-id: dispute-id,
            escrow-id: escrow-id,
            filed-by: tx-sender,
            respondent: respondent,
            voting-ends-at: voting-ends,
            timestamp: stacks-block-time
        })
        (ok dispute-id)
    )
)

(define-public (register-arbitrator)
    (begin
        (map-set arbitrators tx-sender {
            reputation-score: u0,
            cases-judged: u0,
            accuracy-rate: u0,
            active: true,
            registered-at: stacks-block-time
        })
        (var-set arbitrator-pool-size (+ (var-get arbitrator-pool-size) u1))
        (print {
            event: "arbitrator-registered",
            arbitrator: tx-sender,
            timestamp: stacks-block-time
        })
        (ok true)
    )
)

(define-public (cast-vote
    (dispute-id uint)
    (vote (string-ascii 16))
    (reasoning (string-utf8 256)))
    (let
        (
            (dispute (unwrap! (map-get? disputes dispute-id) ERR_DISPUTE_NOT_FOUND))
            (arbitrator (unwrap! (map-get? arbitrators tx-sender) ERR_NOT_AUTHORIZED))
            (vote-weight (+ u1 (/ (get reputation-score arbitrator) u100)))
        )
        (asserts! (get active arbitrator) ERR_NOT_AUTHORIZED)
        (asserts! (< stacks-block-time (get voting-ends-at dispute)) ERR_VOTING_CLOSED)
        (asserts! (is-none (map-get? arbitrator-votes { dispute-id: dispute-id, arbitrator: tx-sender })) ERR_ALREADY_VOTED)
        
        (map-set arbitrator-votes
            { dispute-id: dispute-id, arbitrator: tx-sender }
            {
                vote: vote,
                reasoning: reasoning,
                voted-at: stacks-block-time,
                weight: vote-weight
            })
        
        (map-set disputes dispute-id
            (merge dispute {
                votes-for-plaintiff: (if (is-eq vote "plaintiff")
                    (+ (get votes-for-plaintiff dispute) vote-weight)
                    (get votes-for-plaintiff dispute)),
                votes-for-defendant: (if (is-eq vote "defendant")
                    (+ (get votes-for-defendant dispute) vote-weight)
                    (get votes-for-defendant dispute))
            }))
        
        (print {
            event: "arbitrator-vote-cast",
            dispute-id: dispute-id,
            arbitrator: tx-sender,
            vote: vote,
            weight: vote-weight,
            timestamp: stacks-block-time
        })
        (ok true)
    )
)

(define-public (resolve-dispute (dispute-id uint))
    (let
        (
            (dispute (unwrap! (map-get? disputes dispute-id) ERR_DISPUTE_NOT_FOUND))
            (resolution (if (> (get votes-for-plaintiff dispute) (get votes-for-defendant dispute))
                "plaintiff"
                "defendant"))
        )
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_AUTHORIZED)
        (asserts! (>= stacks-block-time (get voting-ends-at dispute)) ERR_VOTING_CLOSED)
        (asserts! (not (get resolved dispute)) ERR_DISPUTE_NOT_FOUND)
        
        (map-set disputes dispute-id
            (merge dispute {
                resolved: true,
                resolution: (some resolution),
                resolved-at: stacks-block-time
            }))
        
        (print {
            event: "dispute-resolved",
            dispute-id: dispute-id,
            resolution: resolution,
            votes-plaintiff: (get votes-for-plaintiff dispute),
            votes-defendant: (get votes-for-defendant dispute),
            timestamp: stacks-block-time
        })
        (ok resolution)
    )
)

(define-read-only (get-dispute (dispute-id uint))
    (map-get? disputes dispute-id)
)

(define-read-only (get-arbitrator (arbitrator principal))
    (map-get? arbitrators arbitrator)
)
