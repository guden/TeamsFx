import { FxCore, InputValidationError, UserCancelError } from "@microsoft/teamsfx-core";
import { assert } from "chai";
import "mocha";
import * as sinon from "sinon";
import { engine } from "../../src/commands/engine";
import { createSampleCommand } from "../../src/commands/models/createSample";
import { rootCommand } from "../../src/commands/models/root";
import { CLICommandOption, CLIContext } from "../../src/commands/types";
import { logger } from "../../src/commonlib/logger";
import { getVersion } from "../../src/utils";
import CliTelemetry from "../../src/telemetry/cliTelemetry";
import { createCommand } from "../../src/commands/models/create";
import { err, ok } from "@microsoft/teamsfx-api";
import * as main from "../../src/index";
import { start } from "../../src/commands/index";
import * as activate from "../../src/activate";

describe("CLI Engine", () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe("findCommand", async () => {
    it("should find new template command", async () => {
      const result = engine.findCommand(rootCommand, ["new", "template"]);
      assert.equal(result.cmd.name, createSampleCommand.name);
      assert.deepEqual(result.remainingArgs, []);
    });
  });

  describe("validateOption", async () => {
    it("should find new template command", async () => {
      const option: CLICommandOption = {
        type: "multiSelect",
        description: "test",
        name: "test",
        choices: ["a", "b", "c"],
        value: ["d"],
      };
      const result = engine.validateOption(option);
      assert.isTrue(result.isErr() && result.error instanceof InputValidationError);
    });
  });
  describe("processResult", async () => {
    it("should find new template command", async () => {
      const sendTelemetryErrorEventStub = sandbox
        .stub(CliTelemetry, "sendTelemetryErrorEvent")
        .returns();
      sandbox.stub(logger, "outputError").returns();
      const ctx: CLIContext = {
        command: createCommand,
        optionValues: {},
        globalOptionValues: {},
        argumentValues: [],
        telemetryProperties: {},
      };
      engine.processResult(ctx, new InputValidationError("test", "no reason"));
      assert.isTrue(sendTelemetryErrorEventStub.calledOnce);
    });
  });
  describe("start", async () => {
    it("should display version", async () => {
      sandbox.stub(process, "argv").value(["node", "cli", "--version"]);
      const loggerStub = sandbox.stub(logger, "info");
      await engine.start(rootCommand);
      assert.isTrue(loggerStub.calledWith(getVersion()));
    });
    it("should display help message", async () => {
      sandbox.stub(process, "argv").value(["node", "cli", "-h"]);
      const loggerStub = sandbox.stub(logger, "info");
      await engine.start(rootCommand);
      assert.isTrue(loggerStub.calledOnce);
    });
    it("should validation failed for capability", async () => {
      sandbox
        .stub(process, "argv")
        .value(["node", "cli", "new", "-c", "tab", "-n", "myapp", "-i", "false"]);
      let error: any = {};
      sandbox.stub(engine, "processResult").callsFake((context, fxError) => {
        error = fxError;
      });
      await engine.start(rootCommand);
      assert.isTrue(error && error instanceof InputValidationError);
    });
    it("should run handler success", async () => {
      sandbox.stub(process, "argv").value(["node", "cli", "-i", "true"]);
      const loggerStub = sandbox.stub(logger, "info");
      await engine.start(rootCommand);
      assert.isTrue(loggerStub.calledOnce);
    });
    it("should run command with argument success", async () => {
      sandbox.stub(activate, "createFxCore").returns(new FxCore({} as any));
      sandbox.stub(FxCore.prototype, "createProject").resolves(ok({ projectPath: "..." }));
      sandbox.stub(process, "argv").value(["node", "cli", "new", "template", "samleName"]);
      const loggerStub = sandbox.stub(logger, "info");
      await engine.start(rootCommand);
      assert.isTrue(loggerStub.calledOnce);
    });
    it("should validate argument failed", async () => {
      sandbox.stub(createSampleCommand, "arguments").value([
        {
          type: "singleSelect",
          name: "template",
          description: "Select a sample app to create",
          choices: ["a", "b", "c"],
        },
      ]);
      sandbox.stub(FxCore.prototype, "createProject").resolves(ok({ projectPath: "..." }));
      sandbox.stub(process, "argv").value(["node", "cli", "d"]);
      let error: any = {};
      sandbox.stub(engine, "processResult").callsFake((context, fxError) => {
        error = fxError;
      });
      sandbox.stub(logger, "info");
      await engine.start(createSampleCommand);
      assert.isTrue(error instanceof InputValidationError);
    });
    it("should run handler return error", async () => {
      sandbox.stub(process, "argv").value(["node", "cli"]);
      sandbox.stub(rootCommand, "handler").resolves(err(new UserCancelError()));
      let error: any = {};
      sandbox.stub(engine, "processResult").callsFake((context, fxError) => {
        error = fxError;
      });
      await engine.start(rootCommand);
      assert.isTrue(error instanceof UserCancelError);
    });
    it("should run handler throw error", async () => {
      sandbox.stub(process, "argv").value(["node", "cli"]);
      sandbox.stub(rootCommand, "handler").rejects(new UserCancelError());
      let error: any = {};
      sandbox.stub(engine, "processResult").callsFake((context, fxError) => {
        error = fxError;
      });
      await engine.start(rootCommand);
      assert.isTrue(error instanceof UserCancelError);
    });
  });
  describe("index.start", async () => {
    it("happy path", async () => {
      sandbox.stub(main, "initTelemetryReporter").returns();
      sandbox.stub(main, "sendCommandUsageTelemetry").returns();
      sandbox.stub(engine, "start").resolves();
      await start();
      assert.isTrue(true);
    });
  });
});
