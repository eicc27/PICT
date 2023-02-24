CREATE TABLE IF NOT EXISTS Illusts(
    id TEXT PRIMARY KEY,
    `name` TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS Pictures(
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    illust_id TEXT NOT NULL,
    `time` TEXT NOT NULL,
    last_access TEXT,
    views INT DEFAULT 0,
    FOREIGN KEY (illust_id) REFERENCES Illusts (id)
);
CREATE TABLE IF NOT EXISTS Picture_indexes(
    pid TEXT NOT NULL,
    `index` INT NOT NULL,
    PRIMARY KEY (pid, `index`),
    FOREIGN KEY (pid) REFERENCES Pictures (id)
);
CREATE TABLE IF NOT EXISTS Tags(
    tag TEXT PRIMARY KEY,
    translation TEXT
);
CREATE TABLE IF NOT EXISTS Picture_tags(
    pid TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (pid, tag),
    FOREIGN KEY (pid) REFERENCES Pictures (id),
    FOREIGN KEY (tag) REFERENCES Tags (tag)
);
