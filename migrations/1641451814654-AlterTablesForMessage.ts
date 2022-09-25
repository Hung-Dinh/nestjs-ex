import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterTablesForMessage1641451814654 implements MigrationInterface {
    name = 'AlterTablesForMessage1641451814654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_setting\` DROP COLUMN \`displayName\``);
        await queryRunner.query(`ALTER TABLE \`user_setting\` DROP COLUMN \`avatar\``);
        await queryRunner.query(`ALTER TABLE \`chat_room\` ADD \`avatar\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`chat_room\` ADD \`channelId\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user_setting\` ADD \`useUserWalletId\` bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_setting\` ADD \`useNetworkId\` bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_setting\` ADD \`gasFeeLevel\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_setting\` ADD \`isEnableAutosignMessage\` tinyint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`avatar\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`chat_room\` CHANGE \`name\` \`name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` CHANGE \`displayName\` \`displayName\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`member_in_room\` CHANGE \`displayName\` \`displayName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`chat_room\` CHANGE \`name\` \`name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`avatar\``);
        await queryRunner.query(`ALTER TABLE \`user_setting\` DROP COLUMN \`isEnableAutosignMessage\``);
        await queryRunner.query(`ALTER TABLE \`user_setting\` DROP COLUMN \`gasFeeLevel\``);
        await queryRunner.query(`ALTER TABLE \`user_setting\` DROP COLUMN \`useNetworkId\``);
        await queryRunner.query(`ALTER TABLE \`user_setting\` DROP COLUMN \`useUserWalletId\``);
        await queryRunner.query(`ALTER TABLE \`chat_room\` DROP COLUMN \`channelId\``);
        await queryRunner.query(`ALTER TABLE \`chat_room\` DROP COLUMN \`avatar\``);
        await queryRunner.query(`ALTER TABLE \`user_setting\` ADD \`avatar\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user_setting\` ADD \`displayName\` varchar(255) NOT NULL`);
    }

}
