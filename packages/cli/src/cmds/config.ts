// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { FxError, LogLevel, Result, ok } from "@microsoft/teamsfx-api";
import { Argv, PositionalOptions } from "yargs";
import CLILogProvider from "../commonlib/log";
import CliTelemetry from "../telemetry/cliTelemetry";
import {
  TelemetryEvent,
  TelemetryProperty,
  TelemetrySuccess,
} from "../telemetry/cliTelemetryEvents";
import { CliConfigOptions, UserSettings } from "../userSetttings";
import { YargsCommand } from "../yargsCommand";

const GlobalOptionNames = () =>
  new Set([CliConfigOptions.Telemetry as string, CliConfigOptions.Interactive as string]);

const ConfigOptionOptions: () => PositionalOptions = () => {
  return {
    type: "string",
    description: "User settings option",
    array: true,
    choices: Array.from(GlobalOptionNames().values()),
  };
};

const ConfigValueOptions: () => PositionalOptions = () => {
  return {
    type: "string",
    description: "Option value",
  };
};

export class ConfigGet extends YargsCommand {
  public readonly commandHead = `get`;
  public readonly command = `${this.commandHead} [option]`;
  public readonly description = "Get user global settings.";

  public builder(yargs: Argv): Argv<any> {
    return yargs.positional("option", ConfigOptionOptions());
  }

  public async runCommand(args: { [argName: string]: string }): Promise<Result<null, FxError>> {
    if (args.option === undefined) {
      const globalResult = await this.printGlobalConfig();
      if (globalResult.isErr()) {
        return globalResult;
      }
    } else {
      const globalResult = await this.printGlobalConfig(args.option);
      if (globalResult.isErr()) {
        return globalResult;
      }
    }
    CliTelemetry.sendTelemetryEvent(TelemetryEvent.ConfigGet, {
      [TelemetryProperty.Success]: TelemetrySuccess.Yes,
    });
    return ok(null);
  }

  private async printGlobalConfig(option?: string): Promise<Result<null, FxError>> {
    const result = UserSettings.getConfigSync();
    if (result.isErr()) {
      CliTelemetry.sendTelemetryErrorEvent(TelemetryEvent.ConfigGet, result.error);
      return result;
    }

    const config = result.value;
    if (option && GlobalOptionNames().has(option)) {
      CLILogProvider.necessaryLog(LogLevel.Info, JSON.stringify(config[option], null, 2), true);
    } else {
      CLILogProvider.necessaryLog(LogLevel.Info, JSON.stringify(config, null, 2), true);
    }
    return ok(null);
  }
}

export class ConfigSet extends YargsCommand {
  public readonly commandHead = `set`;
  public readonly command = `${this.commandHead} <option> <value>`;
  public readonly description = "Set user settings.";

  public builder(yargs: Argv): Argv<any> {
    return yargs
      .positional("option", ConfigOptionOptions())
      .positional("value", ConfigValueOptions());
  }

  public async runCommand(args: { [argName: string]: string }): Promise<Result<null, FxError>> {
    const globalResult = await this.setGlobalConfig(args.option, args.value);
    if (globalResult.isErr()) {
      CliTelemetry.sendTelemetryErrorEvent(TelemetryEvent.ConfigSet, globalResult.error);
      return globalResult;
    }

    CliTelemetry.sendTelemetryEvent(TelemetryEvent.ConfigSet, {
      [TelemetryProperty.Success]: TelemetrySuccess.Yes,
    });
    return ok(null);
  }

  private async setGlobalConfig(option: string, value: string): Promise<Result<null, FxError>> {
    if (GlobalOptionNames().has(option)) {
      const opt = { [option]: value };
      const result = UserSettings.setConfigSync(opt);
      if (result.isErr()) {
        CLILogProvider.necessaryLog(LogLevel.Error, "Configure user settings failed");
        return result;
      }
      CLILogProvider.necessaryLog(LogLevel.Info, `Successfully configured user setting ${option}.`);
    } else {
      CLILogProvider.necessaryLog(LogLevel.Warning, `No user setting ${option}.`);
    }
    return ok(null);
  }
}

export default class Config extends YargsCommand {
  public readonly commandHead = `config`;
  public readonly command = `${this.commandHead} <action>`;
  public readonly description = "Configure user settings.";

  public readonly subCommands: YargsCommand[] = [new ConfigGet(), new ConfigSet()];

  public builder(yargs: Argv): Argv<any> {
    this.subCommands.forEach((cmd) => {
      yargs.command(cmd.command, cmd.description, cmd.builder.bind(cmd), cmd.handler.bind(cmd));
    });
    return yargs
      .options("action", {
        description: `${this.subCommands.map((cmd) => cmd.commandHead).join("|")}`,
        type: "string",
        choices: this.subCommands.map((cmd) => cmd.commandHead),
        global: false,
      })
      .version(false)
      .hide("interactive")
      .hide("action");
  }

  public async runCommand(args: { [argName: string]: string }): Promise<Result<null, FxError>> {
    return ok(null);
  }
}
