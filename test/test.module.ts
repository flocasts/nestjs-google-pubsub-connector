import { Module } from "@nestjs/common";
import { TestController } from "./test.controller";

/**
 * The Test Module
 */
@Module({
    controllers: [TestController],
})
export class TestModule {
}