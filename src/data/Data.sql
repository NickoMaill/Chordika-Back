CREATE  FUNCTION update_updatedAt()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedat" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE Users (
	ID SERIAL PRIMARY KEY,
  username VARCHAR(250) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  password VARCHAR(300),
  lastname VARCHAR(100) NOT NULL;
  firstname VARCHAR(100) NOT NULL;
  name VARCHAR(450) GENERATED ALWAYS AS (TRIM(COALESCE(firstname, '') || ' ' || COALESCE(UPPER(lastname), ''))) STORED,
  levelAccess INTEGER NOT NULL;
  lastConDate TIMESTAMP;
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT,
);

CREATE TRIGGER update_updatedAt
    BEFORE UPDATE
    ON users
    FOR EACH ROW
EXECUTE PROCEDURE update_updatedAt();

CREATE TABLE Tokens (
	ID SERIAL PRIMARY KEY,
  Token VARCHAR(250) NOT NULL,
  Type VARCHAR(3) NOT NULL,
  UserId INTEGER NOT NULL,
  UserIp VARCHAR(39),
  UserAgent VARCHAR(500),
  MachineId VARCHAR(150),
  Expires TIMESTAMP NOT NULL,
  Revoked BOOLEAN DEFAULT FALSE,
  AddedAt TIMESTAMP DEFAULT NOW(),
  UpdatedAt TIMESTAMP,
  CONSTRAINT fk_usr FOREIGN KEY(UserId) REFERENCES Users(id)
);

CREATE OR REPLACE TRIGGER update_updatedAt
    BEFORE UPDATE
    ON Tokens
    FOR EACH ROW
EXECUTE PROCEDURE update_updatedAt();

CREATE TABLE DataText (
	ID SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  code VARCHAR(10) NOT NULL,
  sortOrder INTEGER,
  AddedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP
);

CREATE TRIGGER update_updatedAt
    BEFORE UPDATE
    ON DataText
    FOR EACH ROW
EXECUTE PROCEDURE update_updatedAt();

CREATE TABLE Logs (
	ID SERIAL PRIMARY KEY,
  userId INTEGER,
  action VARCHAR(200) NOT NULL,
  description TEXT,
  target VARCHAR(50),
  call VARCHAR(100),
  ipaddress VARCHAR(35),
  AdditionalData TEXT,
  AddedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP,
  CONSTRAINT fk_logs_uid FOREIGN KEY (userId) REFERENCES Users(id)
);

CREATE TRIGGER update_updatedAt
    BEFORE UPDATE
    ON Logs
    FOR EACH ROW
EXECUTE PROCEDURE update_updatedAt();

ALTER TABLE Logs ADD COLUMN userId INTEGER;

CREATE TABLE Schedules (
	ID SERIAL PRIMARY KEY,
	name VARCHAR(300),
	description VARCHAR(2000),
	frequence VARCHAR(8),
	method VARCHAR(90),
	statut INTEGER,
	lastexecution TIMESTAMP,
  isActive BOOLEAN DEFAULT FALSE;
  total INTEGER,
  current INTEGER,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE TRIGGER update_updatedAt
    BEFORE UPDATE
    ON Schedules
    FOR EACH ROW
EXECUTE PROCEDURE update_updatedAt();

CREATE TABLE schedulesTasks (
  id SERIAL PRIMARY KEY,
  scheduleid INTEGER NOT NULL,
  userid INTEGER,
  current INTEGER NOT NULL DEFAULT 0,
  total INTEGER,
  status INTEGER,
  nstep INTEGER,
  stepname VARCHAR(200),
  totalstep INTEGER,
  startedat timestamp NULL DEFAULT now(),
  endedat timestamp NULL,
  CONSTRAINT fk_ScheduleId FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE SET NULL,
  CONSTRAINT fk_Schedules_UserId FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE TABLE ChordGrids (
  ID SERIAL PRIMARY KEY,
  userId INTEGER,
  isLib BOOLEAN DEFAULT FALSE,
  title VARCHAR(250) NOT NULL,
  composer VARCHAR(250) NOT NULL,
  metricNume INTEGER NOT NULL,
  metricDenom INTEGER NOT NULL,
  comment VARCHAR(500),
  fontStyle VARCHAR(100),
  orientation INTEGER DEFAUKT 0,
  content JSONB NOT NULL DEFAULT [],
  addedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP,
  CONSTRAINT fk_chordGrid_uid FOREIGN KEY (userId) REFERENCES Users(id)
);

CREATE TRIGGER update_updatedAt
    BEFORE UPDATE
    ON ChordGrids
    FOR EACH ROW
EXECUTE PROCEDURE update_updatedAt();