import type { MetaFunction } from "react-router";

export type Route = {
  MetaArgs: {
    params: Record<string, never>;
    data: undefined;
  };
};
