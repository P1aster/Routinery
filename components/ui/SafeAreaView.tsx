import { withUniwind } from "uniwind";
import {
  SafeAreaView as SafeAreaViewBase,
  type SafeAreaViewProps
} from "react-native-safe-area-context";

const BaseSafeAreaView = withUniwind(SafeAreaViewBase);

type Props = SafeAreaViewProps;

export default function SafeAreaView({ edges = ["left", "right"], ...props }: Props) {
  return <BaseSafeAreaView edges={edges} {...props} />;
}
