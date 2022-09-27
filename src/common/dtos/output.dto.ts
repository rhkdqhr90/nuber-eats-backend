import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CoreOutput {
  @Field(() => String, { nullable: true })
  error?: string;
  @Field(() => Boolean, { nullable: true })
  ok: boolean;
}
