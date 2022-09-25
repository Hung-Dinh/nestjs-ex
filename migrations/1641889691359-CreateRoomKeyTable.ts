import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomKeyTable1641889691359 implements MigrationInterface {
    name = 'CreateRoomKeyTable1641889691359';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`room_key\` (
                \`id\` bigint NOT NULL AUTO_INCREMENT,
                \`roomId\` int NOT NULL,
                \`sharedKey\` varchar(255) NOT NULL,
                \`publicKey\` varchar(255) NOT NULL,
                \`privateKey\` varchar(255) NOT NULL,
                \`side\` varchar(255) NOT NULL,
                \`createdAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedAt\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE \`room_key\`
        `);
    }
}
