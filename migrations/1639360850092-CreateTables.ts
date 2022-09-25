import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateTables1639360850092 implements MigrationInterface {
    name = 'CreateTables1639360850092'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`blockchainTx\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`fromAddress\` varchar(255) NOT NULL,
                \`toAddress\` varchar(255) NOT NULL,
                \`msgValue\` varchar(255) NULL,
                \`msgData\` varchar(255) NULL,
                \`memoCode\` varchar(255) NULL,
                \`tokenSymbol\` varchar(255) NOT NULL,
                \`tokenAddress\` varchar(255) NOT NULL,
                \`networkId\` bigint NOT NULL,
                \`blockNumber\` int NULL,
                \`blockHash\` varchar(255) NULL,
                \`blockTimestamp\` varchar(255) NULL,
                \`feeAmount\` varchar(255) NULL,
                \`feeSymbol\` varchar(255) NULL,
                \`unsignedRaw\` varchar(255) NULL,
                \`signedRaw\` varchar(255) NULL,
                \`txHash\` varchar(255) NULL,
                \`txStatus\` varchar(255) NOT NULL,
                \`retryCount\` int NOT NULL,
                \`refTable\` varchar(255) NOT NULL,
                \`refId\` int NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_99293740a92386d93273861221\` (\`networkId\`),
                UNIQUE INDEX \`IDX_cf478fbfa0c521708d03067c2f\` (\`txHash\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`crawl_block\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`networkId\` bigint NOT NULL,
                \`currentBlockNumber\` int NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_803ef471753cd86a0dfa914efd\` (\`networkId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`default_token\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`tokenName\` varchar(255) NOT NULL,
                \`tokenSymbol\` varchar(255) NOT NULL,
                \`tokenAddress\` varchar(255) NOT NULL,
                \`tokenDecimal\` int NOT NULL,
                \`idEnabled\` tinyint NOT NULL,
                \`logo\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`devices\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`userId\` bigint NOT NULL,
                \`deviceId\` varchar(255) NOT NULL,
                \`fcmToken\` varchar(255) NOT NULL,
                \`os\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`IDX_e8a5d59f0ac3040395f159507c\` (\`userId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`kms_cmk\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`keyId\` varchar(255) NOT NULL,
                \`region\` varchar(255) NOT NULL,
                \`alias\` varchar(255) NOT NULL,
                \`arn\` varchar(255) NOT NULL,
                \`idEnabled\` tinyint NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`kms_data_key\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`cmkId\` varchar(255) NOT NULL,
                \`dataKey\` varchar(255) NOT NULL,
                \`idEnabled\` tinyint NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`network\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`chainName\` varchar(255) NOT NULL,
                \`chainId\` varchar(255) NOT NULL,
                \`rpcEndpoint\` varchar(255) NOT NULL,
                \`explorerEndpoint\` varchar(255) NOT NULL,
                \`blockTime\` int NOT NULL,
                \`nativeTokenSymbol\` varchar(255) NOT NULL,
                \`blockConfirmation\` int NOT NULL,
                \`idEnabled\` tinyint NOT NULL,
                \`logo\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`transaction\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`type\` varchar(255) NOT NULL,
                \`userId\` bigint NOT NULL,
                \`userWalletId\` bigint NOT NULL,
                \`networkId\` bigint NOT NULL,
                \`txHash\` varchar(255) NULL,
                \`blockchainTxId\` bigint NULL,
                \`fromAddress\` varchar(255) NOT NULL,
                \`toAddress\` varchar(255) NOT NULL,
                \`amount\` int NOT NULL,
                \`memoCode\` varchar(255) NULL,
                \`transactionStatus\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_cb553b46fd89ba6047b98f5fdd\` (\`txHash\`),
                INDEX \`IDX_16870263272ab06aa519d496d0\` (\`userId\`, \`userWalletId\`, \`networkId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`user_token\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`userId\` bigint NOT NULL,
                \`tokenName\` varchar(255) NOT NULL,
                \`tokenSymbol\` varchar(255) NOT NULL,
                \`tokenAddress\` varchar(255) NOT NULL,
                \`tokenDecimal\` int NOT NULL,
                \`idEnabled\` tinyint NOT NULL,
                \`logo\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_d37db50eecdf9b8ce4eedd2f91\` (\`userId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`user_wallet\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`userId\` bigint NOT NULL,
                \`walletName\` varchar(255) NULL,
                \`address\` varchar(255) NOT NULL,
                \`privateKey\` varchar(255) NULL,
                \`seedPhrase\` varchar(255) NULL,
                \`tokenSymbol\` varchar(255) NOT NULL,
                \`tokenAddress\` varchar(255) NOT NULL,
                \`isHD\` tinyint NOT NULL,
                \`hdPath\` varchar(255) NULL,
                \`kmsDataKeyId\` bigint NULL,
                \`isExternal\` tinyint NOT NULL,
                \`currentBlockNumber\` int NULL,
                \`networkId\` bigint NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_b70b0e9b0dd2eba1c00b76173a\` (\`userId\`, \`kmsDataKeyId\`, \`networkId\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`name\` varchar(100) NULL,
                \`password\` varchar(255) NOT NULL,
                \`username\` varchar(200) NOT NULL,
                \`roles\` text NOT NULL,
                \`isAccountDisabled\` tinyint NOT NULL,
                \`email\` varchar(200) NULL,
                \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`IDX_772886e2f1f47b9ceb04a06e20\` (\`username\`, \`email\`),
                UNIQUE INDEX \`username\` (\`username\`),
                UNIQUE INDEX \`email\` (\`email\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX \`email\` ON \`users\`
        `);
        await queryRunner.query(`
            DROP INDEX \`username\` ON \`users\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_772886e2f1f47b9ceb04a06e20\` ON \`users\`
        `);
        await queryRunner.query(`
            DROP TABLE \`users\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_b70b0e9b0dd2eba1c00b76173a\` ON \`user_wallet\`
        `);
        await queryRunner.query(`
            DROP TABLE \`user_wallet\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_d37db50eecdf9b8ce4eedd2f91\` ON \`user_token\`
        `);
        await queryRunner.query(`
            DROP TABLE \`user_token\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_16870263272ab06aa519d496d0\` ON \`transaction\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_cb553b46fd89ba6047b98f5fdd\` ON \`transaction\`
        `);
        await queryRunner.query(`
            DROP TABLE \`transaction\`
        `);
        await queryRunner.query(`
            DROP TABLE \`network\`
        `);
        await queryRunner.query(`
            DROP TABLE \`kms_data_key\`
        `);
        await queryRunner.query(`
            DROP TABLE \`kms_cmk\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_e8a5d59f0ac3040395f159507c\` ON \`devices\`
        `);
        await queryRunner.query(`
            DROP TABLE \`devices\`
        `);
        await queryRunner.query(`
            DROP TABLE \`default_token\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_803ef471753cd86a0dfa914efd\` ON \`crawl_block\`
        `);
        await queryRunner.query(`
            DROP TABLE \`crawl_block\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_cf478fbfa0c521708d03067c2f\` ON \`blockchainTx\`
        `);
        await queryRunner.query(`
            DROP INDEX \`IDX_99293740a92386d93273861221\` ON \`blockchainTx\`
        `);
        await queryRunner.query(`
            DROP TABLE \`blockchainTx\`
        `);
    }

}
