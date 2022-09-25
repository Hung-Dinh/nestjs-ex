import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomActionTxAndRoomNotificationTxTables1642499938959
    implements MigrationInterface
{
    name = 'CreateRoomActionTxAndRoomNotificationTxTables1642499938959';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`room_action_tx\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`chatRoomId\` bigint NOT NULL,
                \`walletAddress\` varchar(255) NOT NULL,
                \`blockchainTxId\` bigint NULL,
                \`status\` varchar(255) NOT NULL,
                \`type\` varchar(255) NOT NULL,
                \`data\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`room_notification_tx\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`chatRoomId\` bigint NOT NULL,
                \`walletAddress\` varchar(255) NOT NULL,
                \`blockchainTxId\` bigint NULL,
                \`status\` varchar(255) NOT NULL,
                \`type\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`message_tx\` DROP COLUMN \`txHash\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`messages\`
            ADD \`numberOfTxs\` int NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`message_tx\`
            ADD \`txHash\` varchar(255) NULL
        `);
        await queryRunner.query(`
            DROP TABLE \`room_notification_tx\`
        `);
        await queryRunner.query(`
            DROP TABLE \`room_action_tx\`
        `);
    }
}
