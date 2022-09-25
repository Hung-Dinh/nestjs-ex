import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterRoomActionTxAndRoomNotificationTx1642502402097 implements MigrationInterface {
    name = 'AlterRoomActionTxAndRoomNotificationTx1642502402097'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`room_action_tx\`
            ADD \`messageId\` bigint NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`room_notification_tx\`
            ADD \`messageId\` bigint NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`message_tx\` CHANGE \`blockchainTxId\` \`blockchainTxId\` bigint NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`message_tx\` CHANGE \`blockchainTxId\` \`blockchainTxId\` bigint NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`room_notification_tx\` DROP COLUMN \`messageId\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`room_action_tx\` DROP COLUMN \`messageId\`
        `);
    }

}
