import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChatEntities1641271250835 implements MigrationInterface {
    name = 'ChatEntities1641271250835';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`chat_room\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`ownerId\` bigint NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`contractAddress\` varchar(255) NOT NULL,
                \`isGroup\` tinyint NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_b0d1faac0d8a7b0cd001a3fad1\` (\`ownerId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`member_in_room\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`chatRoomId\` bigint NOT NULL,
                \`userId\` bigint NOT NULL,
                \`walletAddress\` varchar(255) NOT NULL,
                \`displayName\` varchar(255) NOT NULL,
                \`nickname\` varchar(255) NOT NULL,
                \`role\` varchar(255) NOT NULL,
                \`status\` tinyint NOT NULL,
                \`addedByUserId\` bigint NOT NULL,
                \`isChatArchived\` tinyint NOT NULL,
                \`muteDuration\` varchar(255) NOT NULL,
                \`lastViewedAt\` datetime NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_99aa8d49d12217f1838e9db768\` (\`chatRoomId\`, \`userId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`messages\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`chatRoomId\` bigint NOT NULL,
                \`userId\` bigint NOT NULL,
                \`txHash\` varchar(255) NOT NULL,
                \`blockchainTxId\` bigint NOT NULL,
                \`replyTo\` bigint NULL,
                \`type\` varchar(255) NOT NULL,
                \`content\` varchar(255) NULL,
                \`file\` varchar(255) NULL,
                \`downloadUrl\` varchar(255) NULL,
                \`isPinned\` tinyint NOT NULL DEFAULT 0,
                \`status\` varchar(255) NOT NULL,
                \`toAddress\` varchar(255) NOT NULL,
                \`tokenSymbol\` varchar(255) NOT NULL,
                \`tokenAmount\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_e279d132d884c072a7d29ae9d5\` (\`txHash\`),
                INDEX \`IDX_2cc31046466d272d583a26cebb\` (\`chatRoomId\`, \`userId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX \`IDX_2cc31046466d272d583a26cebb\` ON \`messages\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_e279d132d884c072a7d29ae9d5\` ON \`messages\`
        `);
        await queryRunner.query(`
            DROP TABLE \`messages\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_99aa8d49d12217f1838e9db768\` ON \`member_in_room\`
        `);
        await queryRunner.query(`
            DROP TABLE \`member_in_room\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_b0d1faac0d8a7b0cd001a3fad1\` ON \`chat_room\`
        `);
        await queryRunner.query(`
            DROP TABLE \`chat_room\`
        `);
    }
}
