-- Raw SQL CHECK constraints for Leave Management System

ALTER TABLE "leave_requests"
  ADD CONSTRAINT "chk_leave_requests_date_order" CHECK ("end_date" >= "start_date"),
  ADD CONSTRAINT "chk_leave_requests_same_year" CHECK (EXTRACT(YEAR FROM "start_date") = EXTRACT(YEAR FROM "end_date")),
  ADD CONSTRAINT "chk_leave_requests_half_day" CHECK (("is_half_day" = false) OR ("start_date" = "end_date" AND "half_day_session" IS NOT NULL)),
  ADD CONSTRAINT "chk_leave_requests_total_days_positive" CHECK ("total_days" > 0);

ALTER TABLE "leave_balances"
  ADD CONSTRAINT "chk_leave_balances_non_negative" CHECK ("allocated" >= 0 AND "used" >= 0);

ALTER TABLE "otp_codes"
  ADD CONSTRAINT "chk_otp_codes_attempts_non_negative" CHECK ("attempts" >= 0);
