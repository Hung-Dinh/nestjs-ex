import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableUserToken1646640643353 implements MigrationInterface {
    name = 'AlterTableUserToken1646640643353';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`user_token\`
            ADD \`abi\` longtext NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`user_token\` DROP COLUMN \`abi\`
        `);
    }
}
