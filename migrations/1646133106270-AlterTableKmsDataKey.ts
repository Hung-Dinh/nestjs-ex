import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTableKmsDataKey1646133106270 implements MigrationInterface {
    name = 'AlterTableKmsDataKey1646133106270';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`kms_data_key\` DROP COLUMN \`cmkId\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`kms_data_key\`
            ADD \`cmkId\` bigint NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`kms_data_key\` DROP COLUMN \`dataKey\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`kms_data_key\`
            ADD \`dataKey\` text NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`kms_data_key\` DROP COLUMN \`dataKey\`
        `);
    }
}
