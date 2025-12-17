;; escrow-analytics.clar
;; On-chain analytics tracking for escrow service
;; Aggregates data for dashboards and reporting

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u20101))

;; ========================================
;; Data Variables - Daily Metrics
;; ========================================

(define-data-var daily-volume uint u0)
(define-data-var daily-escrows uint u0)
(define-data-var daily-fees uint u0)
(define-data-var daily-disputes uint u0)
(define-data-var last-reset-day uint u0)

;; ========================================
;; Data Maps - Historical Data
;; ========================================

;; Daily snapshots (day number since epoch)
(define-map daily-snapshots
    uint
    {
        volume: uint,
        escrows-created: uint,
        escrows-completed: uint,
        fees-collected: uint,
        disputes: uint,
        unique-users: uint
    }
)

;; Monthly aggregates
(define-map monthly-stats
    uint
    {
        volume: uint,
        escrows: uint,
        fees: uint,
        disputes: uint
    }
)

;; Top users by volume
(define-map user-volume-rank
    principal
    uint
)

;; ========================================
;; Read-Only Functions
;; ========================================

(define-read-only (get-current-day)
    (/ stacks-block-time u86400))

(define-read-only (get-current-month)
    (/ stacks-block-time u2592000))

(define-read-only (get-daily-snapshot (day uint))
    (map-get? daily-snapshots day))

(define-read-only (get-monthly-stats (month uint))
    (map-get? monthly-stats month))

(define-read-only (get-user-rank (user principal))
    (default-to u0 (map-get? user-volume-rank user)))

(define-read-only (get-current-daily-metrics)
    {
        day: (get-current-day),
        volume: (var-get daily-volume),
        escrows: (var-get daily-escrows),
        fees: (var-get daily-fees),
        disputes: (var-get daily-disputes)
    })

;; ========================================
;; Recording Functions (called by escrow-manager)
;; ========================================

;; Record new escrow
(define-public (record-escrow-created (amount uint) (user principal))
    (let
        (
            (current-day (get-current-day))
        )
        ;; Reset daily counters if new day
        (if (> current-day (var-get last-reset-day))
            (begin
                ;; Save previous day snapshot
                (map-set daily-snapshots (var-get last-reset-day) {
                    volume: (var-get daily-volume),
                    escrows-created: (var-get daily-escrows),
                    escrows-completed: u0,
                    fees-collected: (var-get daily-fees),
                    disputes: (var-get daily-disputes),
                    unique-users: u0
                })
                ;; Reset counters
                (var-set daily-volume u0)
                (var-set daily-escrows u0)
                (var-set daily-fees u0)
                (var-set daily-disputes u0)
                (var-set last-reset-day current-day))
            true)
        
        ;; Update daily metrics
        (var-set daily-escrows (+ (var-get daily-escrows) u1))
        
        ;; EMIT: analytics event
        (print {
            event: "analytics-escrow-created",
            day: current-day,
            amount: amount,
            user: user
        })
        
        (ok true)))

;; Record completed escrow with fees
(define-public (record-escrow-completed (amount uint) (fee uint) (user principal))
    (let
        (
            (current-day (get-current-day))
            (current-month (get-current-month))
            (user-current-volume (get-user-rank user))
        )
        ;; Update daily
        (var-set daily-volume (+ (var-get daily-volume) amount))
        (var-set daily-fees (+ (var-get daily-fees) fee))
        
        ;; Update monthly
        (match (map-get? monthly-stats current-month)
            stats (map-set monthly-stats current-month (merge stats {
                volume: (+ (get volume stats) amount),
                fees: (+ (get fees stats) fee)
            }))
            (map-set monthly-stats current-month {
                volume: amount,
                escrows: u1,
                fees: fee,
                disputes: u0
            }))
        
        ;; Update user ranking
        (map-set user-volume-rank user (+ user-current-volume amount))
        
        ;; EMIT: analytics event
        (print {
            event: "analytics-escrow-completed",
            day: current-day,
            month: current-month,
            amount: amount,
            fee: fee,
            user: user,
            user-total-volume: (+ user-current-volume amount)
        })
        
        (ok true)))

;; Record dispute
(define-public (record-dispute (escrow-id uint))
    (let
        (
            (current-day (get-current-day))
            (current-month (get-current-month))
        )
        (var-set daily-disputes (+ (var-get daily-disputes) u1))
        
        ;; Update monthly disputes
        (match (map-get? monthly-stats current-month)
            stats (map-set monthly-stats current-month (merge stats {
                disputes: (+ (get disputes stats) u1)
            }))
            true)
        
        ;; EMIT: analytics event
        (print {
            event: "analytics-dispute-recorded",
            day: current-day,
            escrow-id: escrow-id
        })
        
        (ok true)))
