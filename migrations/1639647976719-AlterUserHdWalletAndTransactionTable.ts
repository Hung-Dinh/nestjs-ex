import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterUserHdWalletAndTransactionTable1639647976719 implements MigrationInterface {
    name = 'AlterUserHdWalletAndTransactionTable1639647976719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`user_hdwallet\` DROP COLUMN \`tokenSymbol\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_hdwallet\` DROP COLUMN \`tokenAddress\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`transaction\` DROP COLUMN \`amount\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`transaction\`
            ADD \`amount\` varchar(255) NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`transaction\` DROP COLUMN \`amount\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`transaction\`
            ADD \`amount\` int NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_hdwallet\`
            ADD \`tokenAddress\` varchar(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_hdwallet\`
            ADD \`tokenSymbol\` varchar(255) NOT NULL
        `);
    }

}
