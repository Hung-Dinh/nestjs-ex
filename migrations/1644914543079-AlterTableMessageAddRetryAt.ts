import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableMessageAddRetryAt1644914543079
    implements MigrationInterface
{
    name = 'AlterTableMessageAddRetryAt1644914543079';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`messages\`
            ADD \`retryAt\` datetime NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`messages\` DROP COLUMN \`retryAt\`
        `);
    }
}
