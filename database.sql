/* ================= USERS ================= */

CREATE TABLE users(
 id SERIAL PRIMARY KEY,
 name TEXT NOT NULL,
 email TEXT UNIQUE NOT NULL,
 password TEXT NOT NULL,
 verified BOOLEAN DEFAULT false,
 xp INTEGER DEFAULT 0,
 avatar_stage INTEGER DEFAULT 0,
 created_at TIMESTAMP DEFAULT NOW()
);

/* ================= EMAIL VERIFICATION ================= */

CREATE TABLE verification_codes(
 id SERIAL PRIMARY KEY,
 email TEXT,
 code TEXT,
 created_at TIMESTAMP DEFAULT NOW()
);

/* ================= HABITS ================= */

CREATE TABLE habits(
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
 habit_name TEXT NOT NULL,
 day_of_week TEXT,
 habit_type TEXT,
 xp_value INTEGER DEFAULT 10
);

/* ================= HABIT LOGS ================= */

CREATE TABLE habit_logs(
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
 habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
 log_date TIMESTAMP DEFAULT NOW(),
 completed BOOLEAN DEFAULT true,
 xp_earned INTEGER DEFAULT 10
);

/* ================= XP PENALTIES ================= */

CREATE TABLE xp_penalties(
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
 penalty INTEGER DEFAULT 5,
 reason TEXT,
 created_at TIMESTAMP DEFAULT NOW()
);

/* ================= FOCUS MODE ================= */

CREATE TABLE focus_sessions(
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
 start_time TIMESTAMP,
 end_time TIMESTAMP,
 duration INTEGER
);

/* ================= DAILY ANALYTICS VIEW ================= */

CREATE VIEW daily_progress AS
SELECT
 user_id,
 DATE(log_date) as day,
 COUNT(*) as habits_completed,
 SUM(xp_earned) as xp_gained
FROM habit_logs
GROUP BY user_id, day
ORDER BY day;

/* ================= PERFORMANCE INDEXES ================= */

CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_habit_user ON habits(user_id);
CREATE INDEX idx_log_user ON habit_logs(user_id);
CREATE INDEX idx_penalty_user ON xp_penalties(user_id);
CREATE INDEX idx_focus_user ON focus_sessions(user_id);