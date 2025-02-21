import { assert } from "chai";
import "mocha";
import * as sinon from "sinon";
import { helper } from "../../src/commands/helper";
import { ok } from "@microsoft/teamsfx-api";
import { CLICommand } from "../../src/commands/types";
import { createCommand } from "../../src/commands/models/create";
import { rootCommand } from "../../src/commands/models/root";
import { createSampleCommand } from "../../src/commands/models/createSample";
import { cloneDeep } from "lodash";

describe("CLI helper", () => {
  const sandbox = sinon.createSandbox();

  afterEach(() => {
    sandbox.restore();
  });

  describe("formatOptionName", async () => {
    it("should display required when require is true, displayRequired is true, withRequired is true", async () => {
      helper.displayRequired = true;
      const result = helper.formatOptionName({
        type: "text",
        description: "test",
        shortName: "a",
        required: true,
        name: "test-option-name",
      });
      assert.equal(result, "--test-option-name -a  [Required]");
    });
    it("should not display required when require is false, displayRequired is true, withRequired is true", async () => {
      helper.displayRequired = true;
      const result = helper.formatOptionName({
        type: "text",
        description: "test",
        shortName: "a",
        required: false,
        name: "test-option-name",
      });
      assert.equal(result, "--test-option-name -a");
    });
    it("should not display required when require is true, displayRequired is true, withRequired is false", async () => {
      helper.displayRequired = true;
      const result = helper.formatOptionName(
        {
          type: "text",
          description: "test",
          shortName: "a",
          required: true,
          name: "test-option-name",
        },
        false
      );
      assert.equal(result, "--test-option-name -a");
    });
    it("should not display required when require is true, displayRequired is false, withRequired is true", async () => {
      helper.displayRequired = false;
      const result = helper.formatOptionName(
        {
          type: "text",
          description: "test",
          shortName: "a",
          required: true,
          name: "test-option-name",
        },
        true
      );
      assert.equal(result, "--test-option-name -a");
    });
    it("should display required with indent when require is true, displayRequired is true, withRequired is true, insertIndent is true", async () => {
      helper.displayRequired = true;
      helper.termWidth = 40;
      const result = helper.formatOptionName(
        {
          type: "text",
          description: "test",
          shortName: "a",
          required: true,
          name: "test-option-name",
        },
        true,
        true
      );
      assert.equal(result, "--test-option-name -a         [Required]");
    });
  });

  describe("formatArgumentName", async () => {
    it("should display required argument", async () => {
      const result = helper.formatArgumentName({
        type: "text",
        description: "test",
        required: true,
        name: "test-argument-name",
      });
      assert.equal(result, "<test-argument-name>");
    });
    it("should display none-required argument", async () => {
      const result = helper.formatArgumentName({
        type: "text",
        description: "test",
        required: false,
        name: "test-argument-name",
      });
      assert.equal(result, "[test-argument-name]");
    });
  });

  describe("formatCommandName", async () => {
    it("should display required argument", async () => {
      const result = helper.formatCommandName({
        name: "test",
        fullName: "test",
        description: "test",
        options: [
          { type: "text", name: "test-option-name", description: "test option", required: true },
        ],
        arguments: [
          {
            type: "text",
            name: "test-argument-name",
            description: "test argument",
            required: true,
          },
        ],
        handler: async () => ok(undefined),
      });
      assert.equal(result, "test [options] <test-argument-name>");
    });
  });
  describe("formatSubCommandName", async () => {
    it("should display required argument", async () => {
      const result = helper.formatSubCommandName({
        name: "test",
        fullName: "test",
        description: "test",
        options: [
          { type: "text", name: "test-option-name", description: "test option", required: true },
        ],
        arguments: [
          {
            type: "text",
            name: "test-argument-name",
            description: "test argument",
            required: true,
          },
        ],
        handler: async () => ok(undefined),
      });
      assert.equal(result, "test [options] <test-argument-name>");
    });
  });
  describe("computePadWidth", async () => {
    it("happy path", async () => {
      const command: CLICommand = {
        name: "test",
        fullName: "test",
        description: "test",
        options: [
          { type: "text", name: "test-option-name", description: "test option", required: true },
        ],
        arguments: [
          {
            type: "text",
            name: "test-argument-name",
            description: "test argument",
            required: true,
          },
        ],
        handler: async () => ok(undefined),
      };
      const result = helper.computePadWidth(command, command);
      assert.equal(result, 30);
    });
  });

  describe("prettifyReturnLine", async () => {
    it("happy path 1", async () => {
      const res = helper.prettifyReturnLine(
        `--capability -c        [Required]  Specifies the Teams App capability. Allowed value: ["bot", "notification", "command-bot", etc.]. Use 'teamsfx help --list-capabilities' to see all available options.`,
        159,
        35,
        40
      );
      assert.equal(
        res,
        `--capability -c        [Required]  Specifies the Teams App capability. Allowed value: ["bot", "notification", "command-bot", etc.]. Use 'teamsfx help\n                                   --list-capabilities' to see all available options.`
      );
    });

    it("happy path 2", async () => {
      const res = helper.prettifyReturnLine(
        `--capability -c        [Required]  Specifies the Teams App capability. Allowed value: ["bot", "notification", "command-bot", etc.]. Use 'teamsfx help --list-capabilities' to see all available options.`,
        60,
        35,
        40
      );
      assert.equal(
        res,
        `--capability -c        [Required]  Specifies the Teams App capability. Allowed value: ["bot", "notification", "command-bot", etc.]. Use 'teamsfx help --list-capabilities' to see all available options.`
      );
    });
  });

  describe("formatItem", async () => {
    it("happy path", async () => {
      const res = helper.formatItem(
        "--capability -c        [Required]",
        `Specifies the Teams App capability. Allowed value: ["bot", "notification", "command-bot", etc.]. Use 'teamsfx help --list-capabilities' to see all available options.`
      );
      assert.equal(
        res,
        `--capability -c        [Required]         Specifies the Teams App capability. Allowed value: ["bot", "notification", "command-bot", etc.]. Use 'teamsfx help --list-capabilities' to see all available options.`
      );
    });
    it("happy path 2", async () => {
      const res = helper.formatItem("--capability -c        [Required]", "");
      assert.equal(res, "--capability -c        [Required]");
    });
  });

  describe("formatAllowedValue", async () => {
    it("happy path", async () => {
      const res = helper.formatAllowedValue(["a", "b", "c", "d"]);
      assert.equal(res, `Allowed value: ["a", "b", "c", etc.].`);
    });
  });

  describe("formatArgumentDescription", async () => {
    it("happy path", async () => {
      const res = helper.formatArgumentDescription({
        type: "singleSelect",
        name: "test",
        description: "Description.",
        default: "a",
        choices: ["a", "b", "c", "d"],
        choiceListCommand: "teamsfx list",
      });
      assert.equal(
        res,
        `Description. Allowed value: ["a", "b", "c", etc.]. Default value: "a". Use 'teamsfx list' to see all available options.`
      );
    });
  });
  describe("formatOptionDescription", async () => {
    it("happy path", async () => {
      const res = helper.formatOptionDescription({
        type: "singleSelect",
        name: "test",
        description: "Description.",
        default: "a",
        choices: ["a", "b", "c", "d"],
        choiceListCommand: "teamsfx list",
      });
      assert.equal(
        res,
        `Description. Allowed value: ["a", "b", "c", etc.]. Default value: "a". Use 'teamsfx list' to see all available options.`
      );
    });
  });
  describe("formatHelp", async () => {
    it("happy path for 'teamsfx new'", async () => {
      const rcommand = cloneDeep(rootCommand);
      rcommand.header = "Header:";
      rcommand.footer = "Footer:";
      rcommand.sortOptions = true;
      const res = helper.formatHelp(createCommand, rcommand);
      assert.include(res, "Header:");
      assert.include(res, "Footer:");
      assert.include(res, "Usage:");
      assert.include(res, "Options:");
      assert.include(res, "Global Options:");
      assert.include(res, "Commands:");
      assert.include(res, "Examples:");
    });
    it("happy path for 'teamsfx new template'", async () => {
      const command = createSampleCommand;
      const res = helper.formatHelp(command, rootCommand);
      assert.include(res, "<sample-name>");
    });
  });
});
