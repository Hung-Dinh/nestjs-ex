import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMessageTables1641356095848 implements MigrationInterface {
    name = 'UpdateMessageTables1641356095848'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX \`IDX_b0d1faac0d8a7b0cd001a3fad1\` ON \`chat_room\`
        `);
        await queryRunner.query(`
        DROP INDEX \`IDX_e279d132d884c072a7d29ae9d5\` ON \`messages\`
        `);
        await queryRunner.query(`
        CREATE TABLE \`message_tx\` (
            \`id\` bigint NOT NULL AUTO_INCREMENT, 
            \`messageId\` bigint NOT NULL, 
            \`txHash\` varchar(255) NOT NULL, 
            \`blockchainTxId\` bigint NOT NULL, 
            \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), 
            \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
            INDEX \`IDX_ac29134f20ce6672bb72a53aa0\` (\`messageId\`), 
            PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
        await queryRunner.query(`
        CREATE TABLE \`user_setting\` (
            \`id\` bigint NOT NULL AUTO_INCREMENT, 
            \`userId\` bigint NOT NULL, 
            \`language\` varchar(255) NOT NULL, 
            \`displayCurrency\` varchar(255) NOT NULL,
            \`biometrics\` tinyint NOT NULL, 
            \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), 
            \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            UNIQUE INDEX \`IDX_4b46d4a3adec99377740b0bafa\` (\`userId\`), 
            PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB
        `);
        await queryRunner.query(`
        ALTER TABLE \`messages\` 
        DROP COLUMN \`txHash\`
        `);
        await queryRunner.query(`
        ALTER TABLE \`messages\` 
        DROP COLUMN \`blockchainTxId\`
        `);
        await queryRunner.query(`
        ALTER TABLE \`messages\` 
        DROP COLUMN \`toAddress\`
        `);
        await queryRunner.query(`
        ALTER TABLE \`messages\` 
        DROP COLUMN \`tokenSymbol\`
        `);
        await queryRunner.query(`
        ALTER TABLE \`messages\` 
        DROP COLUMN \`tokenAmount\`
        `);
        await queryRunner.query(`
        ALTER TABLE \`chat_room\` 
        ADD \`status\` varchar(255) NOT NULL
        `);
        await queryRunner.query(`
        ALTER TABLE \`chat_room\` 
        CHANGE \`contractAddress\` \`contractAddress\` varchar(255) NULL
        `);
        await queryRunner.query(`
        ALTER TABLE \`member_in_room\` 
        CHANGE \`nickname\` \`nickname\` varchar(255) NULL
        `);
        await queryRunner.query(`
        ALTER TABLE \`member_in_room\` 
        CHANGE \`isChatArchived\` \`isChatArchived\` tinyint NOT NULL DEFAULT 0
        `);
        await queryRunner.query(`
        ALTER TABLE \`member_in_room\` 
        DROP COLUMN \`muteDuration\`
        `);
        await queryRunner.query(`
        ALTER TABLE \`member_in_room\` 
        ADD \`muteDuration\` datetime NULL
        `);
        await queryRunner.query(`
        ALTER TABLE \`user_contact\` 
        CHANGE \`avatar\` \`avatar\` varchar(255) NULL
        `);
        await queryRunner.query(`
        CREATE INDEX \`IDX_f0d8ad64243fa2ca2800da0dfd\` 
        ON \`chat_room\` (\`ownerId\`)
        `);
        await queryRunner.query(`
        CREATE INDEX \`IDX_a5816d3d0385f99ead46fb4017\` 
        ON \`user_contact\` (\`userId\`)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_a5816d3d0385f99ead46fb4017\` ON \`user_contact\``);
        await queryRunner.query(`DROP INDEX \`IDX_f0d8ad64243fa2ca2800da0dfd\` ON \`chat_room\``);
        await queryRunner.query(`ALTER TABLE \`user_contact\` CHANGE \`avatar\` \`avatar\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` DROP COLUMN \`muteDuration\``);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` ADD \`muteDuration\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` CHANGE \`isChatArchived\` \`isChatArchived\` tinyint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`member_in_room\` CHANGE \`nickname\` \`nickname\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`chat_room\` CHANGE \`contractAddress\` \`contractAddress\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`chat_room\` DROP COLUMN \`status\``);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`tokenAmount\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`tokenSymbol\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`toAddress\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`blockchainTxId\` bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`txHash\` varchar(255) NOT NULL`);
        await queryRunner.query(`DROP INDEX \`IDX_4b46d4a3adec99377740b0bafa\` ON \`user_setting\``);
        await queryRunner.query(`DROP TABLE \`user_setting\``);
        await queryRunner.query(`DROP INDEX \`IDX_ac29134f20ce6672bb72a53aa0\` ON \`message_tx\``);
        await queryRunner.query(`DROP TABLE \`message_tx\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_e279d132d884c072a7d29ae9d5\` ON \`messages\` (\`txHash\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_b0d1faac0d8a7b0cd001a3fad1\` ON \`chat_room\` (\`ownerId\`)`);
    }

}
