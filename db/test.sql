SELECT *
FROM Pictures
    JOIN Illusts ON Pictures.illust_id = Illusts.id
    JOIN Picture_indexes ON Picture_indexes.pid = Pictures.id
    JOIN Picture_tags ON Picture_tags.pid = Pictures.id
    JOIN Tags ON Tags.tag = Picture_tags.tag
-- WHERE STRFTIME("%Y", Pictures.time) = '2020'
-- ORDER BY Pictures.time DESC
ORDER BY Pictures.last_access DESC