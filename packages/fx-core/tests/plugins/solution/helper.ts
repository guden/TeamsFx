import {
  PluginContext,
  SolutionContext,
  ok,
  Platform,
  AzureAccountProvider,
  ConfigMap,
  SubscriptionInfo,
  Plugin,
  Result,
  FxError,
  Void,
} from "@microsoft/teamsfx-api";
import path from "path";
import { environmentManager } from "../../../src";
import { LocalCrypto } from "../../../src/core/crypto";
import { v4 as uuid } from "uuid";
import { ArmTemplateResult } from "../../../src/common/armInterface";
import sinon from "sinon";
import {
  aadPlugin,
  botPlugin,
  fehostPlugin,
  identityPlugin,
  simpleAuthPlugin,
  SOLUTION_CONFIG_NAME,
  TestFileContent,
} from "../../constants";
import { MockedLogProvider, MockedTelemetryReporter, MockedUserInteraction } from "./util";
import { UserTokenCredentials } from "@azure/ms-rest-nodeauth";
import * as cpUtils from "../../../src/common/cpUtils";

export class TestHelper {
  static appName = "ut_app_name";
  static rootDir = path.join(__dirname, "ut");
  static resourceBaseName = "utappnamedefa000000";
  static resourceNameSuffix = "-ut";
  static resourceGroupName = "ut_rg";
  static subscriptionId = "11111111-2222-3333-4444-555555555555";
  static subscriptionName = "ut_subscription_name";
  static clientId = "ut_client_id";
  static clientSecret = "ut_client_secret";
  static domain = "ut_domain";
  static username = "ut_username";
  static password = "ut_password";
  static envName = "default";
  static envVariable = "ut_env_variable_value";

  static frontendhostingOutputValue = "frontend_hosting_output_value";
  static identityOutputValue = "identity_output_value";
  static simpleAuthOutputValue = "simple_auth_output_value";
  static armTemplateJson = `{"test_key": "test_value"}`;

  static mockSolutionContext(): SolutionContext {
    return {
      envInfo: {
        envName: TestHelper.envName,
        state: new Map<string, any>([
          [
            SOLUTION_CONFIG_NAME,
            new ConfigMap([
              ["resourceBaseName", TestHelper.resourceBaseName],
              ["resourceGroupName", TestHelper.resourceGroupName],
              ["resourceNameSuffix", TestHelper.resourceNameSuffix],
              ["subscriptionId", TestHelper.subscriptionId],
            ]),
          ],
        ]),
        config: environmentManager.newEnvConfigData(TestHelper.appName),
      },
      root: TestHelper.rootDir,
      cryptoProvider: new LocalCrypto("ut"),
      projectSettings: {
        appName: TestHelper.appName,
        projectId: uuid(),
        solutionSettings: {
          name: "",
          version: "",
        },
      },
      answers: { platform: Platform.VSCode },
      azureAccountProvider: Object as any & AzureAccountProvider,
      ui: new MockedUserInteraction(),
      logProvider: new MockedLogProvider(),
      telemetryReporter: new MockedTelemetryReporter(),
    };
  }

  static getMockedDeployCtx(mockedCtx: SolutionContext): any {
    return {
      resourceGroupName: "poll-deployment-rg",
      deploymentName: "poll-deployment",
      finished: false,
      deploymentStartTime: Date.now(),
      ctx: mockedCtx,
      client: undefined,
    };
  }

  static mockedFehostGenerateArmTemplates(mocker: sinon.SinonSandbox): sinon.SinonStub {
    return mocker
      .stub(fehostPlugin, "generateArmTemplates")
      .callsFake(async (ctx: PluginContext) => {
        const res: ArmTemplateResult = {
          Provision: {
            Orchestration:
              "Mocked frontend hosting provision orchestration content. Module path: '{{PluginOutput.fx-resource-frontend-hosting.Provision.frontendHostingProvision.ProvisionPath}}'.",
            Modules: {
              frontendHostingProvision: TestFileContent.feHostProvisionModule,
            },
          },
          Configuration: {
            Orchestration:
              "Mocked frontend hosting configuration orchestration content. Module path: '{{PluginOutput.fx-resource-frontend-hosting.Configuration.frontendHostingConfig.ConfigPath}}'.",
            Modules: {
              frontendHostingConfig: TestFileContent.feHostConfigurationModule,
            },
          },
          Reference: {
            frontendHostingOutputKey: TestFileContent.feHostReferenceValue,
          },
          Parameters: {
            FrontendParameter: TestFileContent.feHostParameterValue,
          },
        };
        return ok(res);
      });
  }

  static mockedFeHostUpdateArmTemplates(mocker: sinon.SinonSandbox): sinon.SinonStub {
    return mocker.stub(fehostPlugin, "updateArmTemplates").callsFake(async (ctx: PluginContext) => {
      return ok({});
    });
  }

  static mockedSimpleAuthGenerateArmTemplates(mocker: sinon.SinonSandbox): sinon.SinonStub {
    return mocker
      .stub(simpleAuthPlugin, "generateArmTemplates")
      .callsFake(async (ctx: PluginContext) => {
        const res: ArmTemplateResult = {
          Provision: {
            Orchestration:
              "Mocked simple auth provision orchestration content. Module path: '{{PluginOutput.fx-resource-simple-auth.Provision.simpleAuthProvision.ProvisionPath}}'.",
            Modules: {
              simpleAuthProvision: TestFileContent.simpleAuthProvisionModule,
            },
          },
          Configuration: {
            Orchestration:
              "Mocked simple auth configuration orchestration content. Module path: '{{PluginOutput.fx-resource-simple-auth.Configuration.simpleAuthConfig.ConfigPath}}'.",
            Modules: {
              simpleAuthConfig: TestFileContent.simpleAuthConfigurationModule,
            },
          },
          Reference: {
            simpleAuthOutputKey: TestFileContent.simpleAuthReferenceValue,
          },
          Parameters: {
            SimpleAuthParameter: TestFileContent.simpleAuthParameterValue,
          },
        };
        return ok(res);
      });
  }

  static mockedSimpleAuthUpdateArmTemplates(mocker: sinon.SinonSandbox): sinon.SinonStub {
    return mocker
      .stub(simpleAuthPlugin, "updateArmTemplates")
      .callsFake(async (ctx: PluginContext) => {
        const res: ArmTemplateResult = {
          Reference: {
            simpleAuthOutputKey2: TestFileContent.simpleAuthReferenceValue2,
          },
          Configuration: {
            Modules: {
              simpleAuthConfig: TestFileContent.simpleAuthUpdatedConfigurationModule,
            },
          },
        };
        return ok(res);
      });
  }

  static mockedAadGenerateArmTemplates(mocker: sinon.SinonSandbox): sinon.SinonStub {
    return mocker.stub(aadPlugin, "generateArmTemplates").callsFake(async (ctx: PluginContext) => {
      const res: ArmTemplateResult = {
        Provision: {
          Orchestration:
            "Mocked aad provision orchestration content. Module path: '{{PluginOutput.fx-resource-aad-app-for-teams.Provision.aadProvision.ProvisionPath}}'.",
          Modules: {
            aadProvision: TestFileContent.aadProvisionModule,
          },
        },
        Configuration: {
          Orchestration:
            "Mocked aad configuration orchestration content. Module path: '{{PluginOutput.fx-resource-aad-app-for-teams.Configuration.aadConfig.ConfigPath}}'.",
          Modules: {
            aadConfig: TestFileContent.aadConfigurationModule,
          },
        },
        Reference: {
          aadOutputKey: TestFileContent.aadReferenceValue,
        },
        Parameters: {
          AadParameter: TestFileContent.aadParameterValue,
        },
      };
      return ok(res);
    });
  }

  static mockedIdentityGenerateArmTemplates(mocker: sinon.SinonSandbox): sinon.SinonStub {
    return mocker
      .stub(identityPlugin, "generateArmTemplates")
      .callsFake(async (ctx: PluginContext) => {
        console.log(`mocked identity generate arm templates`);

        const res: ArmTemplateResult = {
          Provision: {
            Orchestration:
              "Mocked identity provision orchestration content. Module path: '{{PluginOutput.fx-resource-identity.Provision.identityProvision.ProvisionPath}}'.",
            Modules: {
              identityProvision: TestFileContent.identityProvisionModule,
            },
          },
          Configuration: {
            Orchestration:
              "Mocked identity configuration orchestration content. Module path: '{{PluginOutput.fx-resource-identity.Configuration.identityConfig.ConfigPath}}'.",
            Modules: {
              identityConfig: TestFileContent.identityConfigurationModule,
            },
          },
          Reference: {
            identityOutputKey: TestFileContent.identityReferenceValue,
          },
          Parameters: {
            IdentityParameter: TestFileContent.identityParameterValue,
          },
        };
        return ok(res);
      });
  }

  static mockedIdentityUpdateArmTemplates(mocker: sinon.SinonSandbox): sinon.SinonStub {
    return mocker
      .stub(identityPlugin, "updateArmTemplates")
      .callsFake(async (ctx: PluginContext) => {
        return ok({});
      });
  }

  static mockedBotGenerateArmTemplates(mocker: sinon.SinonSandbox): sinon.SinonStub {
    return mocker.stub(botPlugin, "generateArmTemplates").callsFake(async (ctx: PluginContext) => {
      const res: ArmTemplateResult = {
        Provision: {
          Orchestration:
            "Mocked bot provision orchestration content. Module path: '{{PluginOutput.fx-resource-bot.Provision.botProvision.ProvisionPath}}'.",
          Modules: {
            botProvision: TestFileContent.botProvisionModule,
          },
        },
        Configuration: {
          Orchestration:
            "Mocked bot configuration orchestration content. Module path: '{{PluginOutput.fx-resource-bot.Configuration.botConfig.ConfigPath}}'.",
          Modules: {
            botConfig: TestFileContent.botConfigurationModule,
          },
        },
        Reference: {
          botOutputKey: TestFileContent.botReferenceValue,
        },
        Parameters: {
          BotParameter: TestFileContent.botParameterValue,
        },
      };
      return ok(res);
    });
  }

  static mockedBotUpdateArmTemplates(mocker: sinon.SinonSandbox): sinon.SinonStub {
    return mocker.stub(botPlugin, "updateArmTemplates").callsFake(async (ctx: PluginContext) => {
      return ok({});
    });
  }

  static mockArmDeploymentDependencies(mockedCtx: SolutionContext, mocker: sinon.SinonSandbox) {
    mockedCtx.azureAccountProvider!.getAccountCredentialAsync = async function () {
      const azureToken = new UserTokenCredentials(
        TestHelper.clientId,
        TestHelper.domain,
        TestHelper.username,
        TestHelper.password
      );
      return azureToken;
    };
    mockedCtx.azureAccountProvider!.getSelectedSubscription = async function () {
      const subscriptionInfo = {
        subscriptionId: TestHelper.subscriptionId,
        subscriptionName: TestHelper.subscriptionName,
      } as SubscriptionInfo;
      return subscriptionInfo;
    };

    mocker.stub(cpUtils, "executeCommand").returns(
      new Promise((resolve) => {
        resolve(TestHelper.armTemplateJson);
      })
    );
  }

  static mockScaffoldThatAlwaysSucceed(plugin: Plugin) {
    plugin.preScaffold = async function (_ctx: PluginContext): Promise<Result<any, FxError>> {
      return ok(Void);
    };
    plugin.scaffold = async function (_ctx: PluginContext): Promise<Result<any, FxError>> {
      return ok(Void);
    };
    plugin.postScaffold = async function (_ctx: PluginContext): Promise<Result<any, FxError>> {
      return ok(Void);
    };
  }
}
