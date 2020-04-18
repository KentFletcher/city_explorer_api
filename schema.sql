DROP TABLE IF EXISTS locations;

CREATE TABLE locations(
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude INTEGER NOT NULL,
    longitude INTEGER NOT NULL
)

