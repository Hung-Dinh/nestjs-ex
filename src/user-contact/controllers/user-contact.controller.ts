import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_HEADER } from 'src/auth/constants/strategy.constant';
import { AuthHeaderApiKeyGuard } from 'src/auth/guards/auth-header-api-key.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from 'src/shared/dtos/base-api-response.dto';
import { AppLogger } from 'src/shared/logger/logger.service';
import { ReqContext } from 'src/shared/request-context/req-context.decorator';
import { RequestContext } from 'src/shared/request-context/request-context.dto';

import { GetUserContactDetail } from '../dtos/get-user-contact-detail-input.dto';
import { GetUserContactListInput } from '../dtos/get-user-contact-list-input.dto';
import { AddUserContactInput } from '../dtos/user-add-contact-input.dto';
import { UserContactOutput } from '../dtos/user-contact-output.dto';
import { UpdateUserContactInput } from '../dtos/user-update-contact-input.dto';
import { UserContactService } from '../services/user-contact.service';

@ApiTags('user-contact')
@Controller('user-contact')
@ApiSecurity(AUTH_HEADER.API_KEY)
@UseGuards(AuthHeaderApiKeyGuard)
export class UserContactController {
  constructor(
    private readonly userContactService: UserContactService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserContactController.name);
  }

  @Post('/list')
  @ApiOperation({
    summary: 'Get user contact list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([UserContactOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getMyContactList(
    @ReqContext() ctx: RequestContext,
    @Body() input: GetUserContactListInput,
  ): Promise<BaseApiResponse<UserContactOutput[]>> {
    this.logger.log(ctx, `${this.getMyContactList.name} was called`);

    const { contacts, count } =
      await this.userContactService.getUserContactList(ctx, input);
    return {
      data: contacts,
      meta: {
        count,
      },
    };
  }

  @Post('add')
  @ApiOperation({
    summary: 'user add contact API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserContactOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async addContact(
    @ReqContext() ctx: RequestContext,
    @Body() input: AddUserContactInput,
  ): Promise<BaseApiResponse<UserContactOutput>> {
    this.logger.log(ctx, `${this.addContact.name} was called`);
    const newUserContact = await this.userContactService.addContact(ctx, input);
    return { data: newUserContact, meta: {} };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'user remove contact by id API',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async removeContact(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.removeContact.name} was called`);
    return this.userContactService.removeContactById(ctx, id);
  }

  @Post('detail')
  @ApiOperation({
    summary: 'get user contact detail by id API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserContactOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async getContactDetail(
    @ReqContext() ctx: RequestContext,
    @Body() input: GetUserContactDetail,
  ): Promise<BaseApiResponse<UserContactOutput>> {
    this.logger.log(ctx, `${this.getContactDetail.name} was called`);
    const detailContact = await this.userContactService.getContactDetailById(
      ctx,
      input,
    );
    return { data: detailContact, meta: {} };
  }

  @Put('update')
  @ApiOperation({
    summary: 'update user contact',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserContactOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async updateUserDeviced(
    @ReqContext() ctx: RequestContext,
    @Body() input: UpdateUserContactInput,
  ): Promise<BaseApiResponse<UserContactOutput>> {
    this.logger.log(ctx, `${this.updateUserDeviced.name} was called`);

    const userContact = await this.userContactService.updateUserContact(
      ctx,
      ctx.user.id,
      input,
    );
    return { data: userContact, meta: {} };
  }

  @Post('search')
  @ApiOperation({
    summary: 'search user contact by name or address API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([UserContactOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  async searchContact(
    @ReqContext() ctx: RequestContext,
    @Body() input: GetUserContactListInput,
  ): Promise<BaseApiResponse<UserContactOutput[]>> {
    this.logger.log(ctx, `${this.getMyContactList.name} was called`);

    const { contacts, count } = await this.userContactService.searchUserContact(
      ctx,
      input,
    );
    return {
      data: contacts,
      meta: {
        count,
      },
    };
  }
}
