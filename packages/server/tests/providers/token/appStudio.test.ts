// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import "mocha";
import { Duplex } from "stream";
import sinon from "sinon";
import { createMessageConnection } from "vscode-jsonrpc";
import ServerAppStudioTokenProvider from "../../../src/providers/token/appStudio";
import { err, ok } from "@microsoft/teamsfx-api";

chai.use(chaiAsPromised);

class TestStream extends Duplex {
  _write(chunk: string, _encoding: string, done: () => void) {
    this.emit("data", chunk);
    done();
  }

  _read(_size: number) {}
}

describe("appStudio", () => {
  const sandbox = sinon.createSandbox();
  const up = new TestStream();
  const down = new TestStream();
  const msgConn = createMessageConnection(up as any, down as any);

  after(() => {
    sandbox.restore();
  });

  it("constructor", () => {
    const appStudio = new ServerAppStudioTokenProvider(msgConn);
    chai.assert.equal(appStudio["connection"], msgConn);
  });

  describe("method", () => {
    const appStudio = new ServerAppStudioTokenProvider(msgConn);

    it("getAccessToken: ok", () => {
      const promise = Promise.resolve(ok("test"));
      const stub = sandbox.stub(msgConn, "sendRequest").callsFake(() => {
        return promise;
      });
      const res = appStudio.getAccessToken();
      res.then((data) => {
        chai.expect(data).equal("test");
      });
      stub.restore();
    });

    it("getAccessToken: err", async () => {
      const e = new Error("test");
      const promise = Promise.resolve(err(e));
      const stub = sandbox.stub(msgConn, "sendRequest").callsFake(() => {
        return promise;
      });
      await chai.expect(appStudio.getAccessToken()).to.be.rejected;
      stub.restore();
    });

    it("getJsonObject: ok", () => {
      const promise = Promise.resolve(ok("test"));
      const stub = sandbox.stub(msgConn, "sendRequest").callsFake(() => {
        return promise;
      });
      const res = appStudio.getJsonObject();
      res.then((data) => {
        chai.expect(data).equal("test");
      });
      stub.restore();
    });

    it("getJsonObject: err", async () => {
      const e = new Error("test");
      const promise = Promise.resolve(err(e));
      const stub = sandbox.stub(msgConn, "sendRequest").callsFake(() => {
        return promise;
      });
      await chai.expect(appStudio.getJsonObject()).to.be.rejected;
      stub.restore();
    });

    it("signout", async () => {
      await chai.expect(appStudio.signout()).to.be.rejected;
    });

    it("setStatusChangeMap", async () => {
      await chai.expect(
        appStudio.setStatusChangeMap("test", (p1, p2?, p3?): Promise<void> => {
          return new Promise<void>((resolve) => {});
        })
      ).to.be.rejected;
    });

    it("removeStatusChangeMap", async () => {
      await chai.expect(appStudio.removeStatusChangeMap("test")).to.be.rejected;
    });
  });
});