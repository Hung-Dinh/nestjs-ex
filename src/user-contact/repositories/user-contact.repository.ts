import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { UserContact } from '../entities/user-contact.entity';

@EntityRepository(UserContact)
export class UserContactRepository extends Repository<UserContact> {
  async getContactsByUserId(userId: number): Promise<UserContact[]> {
    const userContacts = await this.find({ 
      where: { userId },
      order: {
        name: "ASC"
      }, 
    });
    if (!userContacts) {
      throw new NotFoundException();
    }
    return userContacts;
  }

  async getById(id: number): Promise<UserContact> {
    const userContact = await this.findOne(id);
    if (!userContact) {
      // console.log('id ________NF', id);
      throw new NotFoundException();
    }
    return userContact;
  }

  async getContactsByUserIdAndId(
    userId: number,
    id: number,
  ): Promise<UserContact> {
    const userContact = await this.findOne({ where: { userId, id } });
    if (!userContact) {
      throw new NotFoundException();
    }
    return userContact;
  }
}
