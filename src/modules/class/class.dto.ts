import {
  AddMembersBodySchema,
  AddMembersResSchema,
  AssignVocabListBodySchema,
  AssignVocabListResSchema,
  ClassDetailSchema,
  ClassOverviewSchema,
  CreateClassBodySchema,
  CreateClassResSchema,
  GetClassMaterialsResSchema,
  GetClassMembersResSchema,
  GetClassStatisticsResSchema,
  GetClassVocabListsResSchema,
  GetMemberProgressResSchema,
  GetMyClassesResSchema,
  TransferMemberBodySchema,
  UpdateClassBodySchema,
  UpdateClassResSchema,
} from '@/modules/class/class.schema'
import { createZodDto } from 'nestjs-zod'

export class GetMyClassesResDTO extends createZodDto(GetMyClassesResSchema) {}
export class ClassOverviewResDTO extends createZodDto(ClassOverviewSchema) {}
export class ClassDetailResDTO extends createZodDto(ClassDetailSchema) {}
export class CreateClassResDTO extends createZodDto(CreateClassResSchema) {}
export class CreateClassBodyDTO extends createZodDto(CreateClassBodySchema) {}
export class UpdateClassBodyDTO extends createZodDto(UpdateClassBodySchema) {}
export class UpdateClassResDTO extends createZodDto(UpdateClassResSchema) {}
export class AddMembersBodyDTO extends createZodDto(AddMembersBodySchema) {}
export class AddMembersResDTO extends createZodDto(AddMembersResSchema) {}
export class TransferMemberBodyDTO extends createZodDto(TransferMemberBodySchema) {}
export class AssignVocabListBodyDTO extends createZodDto(AssignVocabListBodySchema) {}
export class AssignVocabListResDTO extends createZodDto(AssignVocabListResSchema) {}
export class GetClassVocabListsResDTO extends createZodDto(GetClassVocabListsResSchema) {}
export class GetClassStatisticsResDTO extends createZodDto(GetClassStatisticsResSchema) {}
export class GetMemberProgressResDTO extends createZodDto(GetMemberProgressResSchema) {}
export class GetClassMembersResDTO extends createZodDto(GetClassMembersResSchema) {}
export class GetClassMaterialsResDTO extends createZodDto(GetClassMaterialsResSchema) {}
