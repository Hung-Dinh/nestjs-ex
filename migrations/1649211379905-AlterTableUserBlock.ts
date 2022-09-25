import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableUserBlock1649211379905 implements MigrationInterface {
    name = 'AlterTableUserBlock1649211379905';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`user_block\`
            ADD \`blockedWalletAddress\` varchar(255) NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`user_block\` DROP COLUMN \`blockedWalletAddress\`
        `);
    }
}
