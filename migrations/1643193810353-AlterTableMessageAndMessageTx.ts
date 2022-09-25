import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableMessageAndMessageTx1643193810353
    implements MigrationInterface
{
    name = 'AlterTableMessageAndMessageTx1643193810353';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`message_tx\`
            ADD \`messagePartId\` int NULL DEFAULT '1'
        `);
        await queryRunner.query(`
            ALTER TABLE \`messages\`
            ADD \`retryCount\` int NULL DEFAULT '1'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`message_tx\` DROP COLUMN \`messagePartId\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`messages\` DROP COLUMN \`retryCount\`
        `);
    }
}
