import ChatBottomBar from "./ChatBottomBar";
import ChatTopbar from "./ChatTopbar";
import MessageList from "./MessageList";

const MessageContainer = () => {
  return (
    <div className="flex flex-col justify-between w-full h-full">
      <ChatTopbar />
      <div className="w-full overflow-x-hidden h-full flex flex-col">
        <MessageList />
        <ChatBottomBar />
      </div>
    </div>
  );
};

export default MessageContainer;
