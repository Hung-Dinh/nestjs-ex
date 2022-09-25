import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterMessagesAndUserSetting1641392206182 implements MigrationInterface {
    name = 'AlterMessagesAndUserSetting1641392206182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`member_in_room\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` ADD \`status\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` ADD \`isPinned\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`user_setting\` ADD \`displayName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_setting\` ADD \`avatar\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_setting\` DROP COLUMN \`avatar\``);
        await queryRunner.query(`ALTER TABLE \`user_setting\` DROP COLUMN \`displayName\``);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` ADD \`status\` tinyint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` DROP COLUMN \`isPinned\``);
    }

}
