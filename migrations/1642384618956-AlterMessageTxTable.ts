import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterMessageTxTable1642384618956 implements MigrationInterface {
    name = 'AlterMessageTxTable1642384618956';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`message_tx\`
            ADD \`status\` varchar(255) NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`message_tx\` DROP COLUMN \`status\`
        `);
    }
}
