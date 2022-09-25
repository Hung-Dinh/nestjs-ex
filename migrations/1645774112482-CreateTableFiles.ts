import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableFiles1645774112482 implements MigrationInterface {
    name = 'CreateTableFiles1645774112482';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`files\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`ownerId\` bigint NOT NULL,
                \`type\` varchar(255) NOT NULL,
                \`driver\` varchar(255) NOT NULL,
                \`path\` varchar(255) NOT NULL,
                \`s3key\` varchar(255) NULL,
                \`bucket\` varchar(255) NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`files\`
        `);
    }
}
