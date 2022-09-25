import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterUserWalletAddUserHDWallet1639472201135 implements MigrationInterface {
    name = 'AlterUserWalletAddUserHDWallet1639472201135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX \`IDX_b70b0e9b0dd2eba1c00b76173a\` ON \`user_wallet\`
        `);
        await queryRunner.query(`
            CREATE TABLE \`user_hdwallet\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`userId\` bigint NOT NULL,
                \`walletName\` varchar(255) NULL,
                \`seedPhrase\` varchar(255) NULL,
                \`tokenSymbol\` varchar(255) NOT NULL,
                \`tokenAddress\` varchar(255) NOT NULL,
                \`isHD\` tinyint NOT NULL,
                \`hdPath\` varchar(255) NULL,
                \`kmsDataKeyId\` bigint NULL,
                \`isExternal\` tinyint NOT NULL,
                \`networkId\` bigint NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_117c106dabf082b7fcc262dffc\` (\`userId\`, \`kmsDataKeyId\`, \`networkId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_wallet\` DROP COLUMN \`seedPhrase\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_wallet\` DROP COLUMN \`tokenSymbol\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_wallet\` DROP COLUMN \`tokenAddress\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_wallet\`
            ADD \`userHDWalletId\` bigint NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_7135b5b5e3c34e26ddc97868ea\` ON \`user_wallet\` (
                \`userId\`,
                \`kmsDataKeyId\`,
                \`networkId\`,
                \`userHDWalletId\`
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX \`IDX_7135b5b5e3c34e26ddc97868ea\` ON \`user_wallet\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_wallet\` DROP COLUMN \`userHDWalletId\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_wallet\`
            ADD \`tokenAddress\` varchar(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_wallet\`
            ADD \`tokenSymbol\` varchar(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_wallet\`
            ADD \`seedPhrase\` varchar(255) NULL
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_117c106dabf082b7fcc262dffc\` ON \`user_hdwallet\`
        `);
        await queryRunner.query(`
            DROP TABLE \`user_hdwallet\`
        `);
        await queryRunner.query(`
            CREATE INDEX \`IDX_b70b0e9b0dd2eba1c00b76173a\` ON \`user_wallet\` (\`userId\`, \`kmsDataKeyId\`, \`networkId\`)
        `);
    }

}
