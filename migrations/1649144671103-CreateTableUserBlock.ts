import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableUserBlock1649144671103 implements MigrationInterface {
    name = 'CreateTableUserBlock1649144671103';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`user_block\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`userId\` bigint NOT NULL,
                \`blockedUserId\` bigint NOT NULL,
                \`status\` tinyint NOT NULL,
                \`reportContent\` text NULL,
                \`type\` varchar(255) NOT NULL DEFAULT 'spam',
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`user_block\`
        `);
    }
}
