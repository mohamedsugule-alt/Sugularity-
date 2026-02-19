-- User Settings
INSERT INTO "UserSettings" (id, mode, dailyCapacity, currentSeason, lastLogin, createdAt)
VALUES ('user-settings-1', 'BALANCED', 100, 'BUILD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Umbrellas
INSERT INTO "Umbrella" (id, title, color) VALUES ('umbrella-1', 'Health', '#10b981');
INSERT INTO "Umbrella" (id, title, color) VALUES ('umbrella-2', 'Finance', '#06b6d4');
INSERT INTO "Umbrella" (id, title, color) VALUES ('umbrella-3', 'Admin', '#64748b');

-- Values
INSERT INTO "Value" (id, title, createdAt) 
VALUES ('value-1', 'Sovereign Individual', CURRENT_TIMESTAMP);

-- Goals
INSERT INTO "Goal" (id, title, status, valueId, deadline)
VALUES ('goal-1', 'Achieve Location Independence', 'ACTIVE', 'value-1', NULL);

-- Projects
INSERT INTO "Project" (id, title, status, archetype, goalId, umbrellaId, createdAt)
VALUES ('project-1', 'Immigration Pipeline', 'ACTIVE', 'PIPELINE', 'goal-1', 'umbrella-3', CURRENT_TIMESTAMP);

-- Tasks
INSERT INTO "Task" (id, title, status, energyCost, isFrog, scheduledDate, projectId, createdAt, updatedAt)
VALUES ('task-1', 'Submit I-140 Petition', 'TODO', 5, 1, CURRENT_TIMESTAMP, 'project-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "Task" (id, title, status, energyCost, recurrenceRule, umbrellaId, createdAt, updatedAt)
VALUES ('task-2', 'Morning Zone 2 Cardio', 'TODO', 3, 'DAILY', 'umbrella-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
