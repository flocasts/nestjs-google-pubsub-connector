import { Module } from "@nestjs/common";
import { TestController } from "./test.controller";

/**
 * The main application module. Import all submodules here.
 */
@Module({
    controllers: [TestController],
})
export class TestModule {
}