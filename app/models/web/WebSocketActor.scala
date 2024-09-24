package models.web

import maze.behaviors.builders.Generator
import maze.classes.{ MazeRequest, SquareGrid }
import akka.actor._
import play.api.libs.json._
import play.api.libs.json.Json

object WebSocketActor {
  // DOCS: Props is a ActorRef configuration object, that is immutable, so it is 
  // thread-safe and fully sharable. Used when creating new actors through 
  // ActorSystem.actorOf and ActorContext.actorOf.
  def props(clientActorRef: ActorRef) = Props(new WebSocketActor(clientActorRef))
}

class WebSocketActor(clientActorRef: ActorRef) extends Actor {
  val logger = play.api.Logger(getClass)

  logger.info(s"WebSocketActor class started")

  // this is where we receive json messages sent by the client
  // and send them a json reply
  def receive = {
    case jsValue: JsValue =>
      logger.info(s"JS-VALUE: $jsValue")
      val json: String = (jsValue \ "message").as[String]

      println("REQUEST: " + json)

      val request: MazeRequest = MazeRequest(json)
      val maze = Generator.generate(request)
      // println("RESPONSE: \n" + maze)
      println("RESPONSE RECEIVED.\n") // don't log response because it may be very large

      val response: JsValue = Json.parse(s"""{"body": ${maze}}""") 
      clientActorRef ! (response)
  }

}
