import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateTableRemoveMessage1649154205952 implements MigrationInterface {
    name = 'CreateTableRemoveMessage1649154205952'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`CREATE TABLE \`remove_message\` (
          \`id\` bigint NOT NULL AUTO_INCREMENT, 
          \`userId\` bigint NOT NULL, 
          \`messageId\` bigint NOT NULL, 
          \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), 
          \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
        PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.query(`DROP TABLE \`remove_message\``);
    }

}
