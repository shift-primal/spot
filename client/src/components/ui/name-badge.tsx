import { UserRound } from "lucide-react";
import { Button } from "#/components/shadcn/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/shadcn/tooltip";

export const NameBadge = ({
	name,
	onClick,
}: {
	name: string;
	onClick: () => void;
}) => (
	<Tooltip>
		<TooltipTrigger
			render={
				<Button
					variant="outline"
					className="absolute top-4 left-4 z-50 max-w-[calc(100%-2rem)] rounded-full bg-background"
					onClick={onClick}
				/>
			}
		>
			<UserRound />
			<span className="truncate">{name}</span>
		</TooltipTrigger>
		<TooltipContent side="bottom">Change name</TooltipContent>
	</Tooltip>
);
