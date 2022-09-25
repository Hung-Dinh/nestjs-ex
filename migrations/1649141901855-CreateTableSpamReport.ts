import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateTableSpamReport1649141901855 implements MigrationInterface {
    name = 'CreateTableSpamReport1649141901855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`spam_report\` (
            \`id\` bigint NOT NULL AUTO_INCREMENT, 
            \`userId\` bigint NOT NULL, 
            \`messageId\` bigint NOT NULL, 
            \`content\` text NULL, 
            \`type\` varchar(255) NOT NULL, 
            \`status\` varchar(255) NOT NULL, 
            \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), 
            \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
        PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`spam_report\``);
    }

}
