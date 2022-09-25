import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserContactTable1641278652045 implements MigrationInterface {
    name = 'UserContactTable1641278652045';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`user_contact\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`userId\` bigint NOT NULL,
                \`address\` varchar(255) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`avatar\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`user_contact\`
        `);
    }
}
