ALTER TABLE `objs` DROP PRIMARY KEY;
ALTER TABLE `objs` ADD COLUMN `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY;
ALTER TABLE `objs` ADD CONSTRAINT `objs_oid_feda89ac_uniq` UNIQUE (`oid`, `repo`);
ALTER TABLE `objs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `objs` ALTER COLUMN `oid` DROP DEFAULT;
DROP INDEX `type` ON `objs`;
DROP INDEX `size` ON `objs`;
CREATE INDEX `objs_599dcce2` ON `objs` (`type`);
CREATE INDEX `objs_f7bd60b7` ON `objs` (`size`);

ALTER TABLE `refs` DROP PRIMARY KEY;
ALTER TABLE `refs` ADD COLUMN `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY;
ALTER TABLE `refs` ADD CONSTRAINT `refs_ref_4a751775_uniq` UNIQUE (`ref`, `repo`);
ALTER TABLE `refs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `refs` ALTER COLUMN `ref` DROP DEFAULT;
DROP INDEX `value` ON `refs`;
CREATE INDEX `refs_2063c160` ON `refs` (`value`);
