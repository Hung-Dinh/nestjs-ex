import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterUserTokenAndDefaultToken1640677435398
    implements MigrationInterface
{
    name = 'AlterUserTokenAndDefaultToken1640677435398';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`default_token\`
            ADD \`networkId\` bigint NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_token\`
            ADD \`networkId\` bigint NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_hdwallet\`
            ADD UNIQUE INDEX \`IDX_330e36c24c199455be7c94dd31\` (\`seedPhrase\`)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`user_hdwallet\` DROP INDEX \`IDX_330e36c24c199455be7c94dd31\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_token\` DROP COLUMN \`networkId\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`default_token\` DROP COLUMN \`networkId\`
        `);
    }
}
