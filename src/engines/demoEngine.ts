import { Factory, Inject, Singleton } from "typescript-ioc";
import { ApiUserComment } from "../dto/APIUserComment";
import { UserComment } from "../entity/UserComment";
import { DatabaseService } from "../services/DatabaseService";

@Singleton
@Factory(() => new DemoEngine())
export class DemoEngine {

   @Inject
   private dbService: DatabaseService;

   public async dummyUserComment(): Promise<ApiUserComment> {
      return {
         name: "John Doe",
         message: "Hello world!"
      }
   }

   public async creatUserComment(comment: ApiUserComment) {
      const repo = this.dbService.manager.getRepository(UserComment);
      const userComment = new UserComment();
      userComment.name = comment.name;
      userComment.message = comment.message;
      const storedUserComment = await this.dbService.manager.save(userComment);
   }

   public async getCommentsForUser(userName: string) {
      const repo = this.dbService.manager.getRepository(UserComment)
      const userComments = await repo.find({ where: { name: userName } })
      return userComments;
   }
}
