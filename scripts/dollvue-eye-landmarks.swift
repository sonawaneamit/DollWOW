import Foundation
import Vision
import ImageIO

// Offline feature localization only. No identity matching or network requests.
let list=try JSONSerialization.jsonObject(with:Data(contentsOf:URL(fileURLWithPath:CommandLine.arguments[1]))) as! [[String:Any]]
var rows=[[String:Any]]()
for item in list {
 let file=item["file"] as! String
 do {
  let url=URL(fileURLWithPath:file),request=VNDetectFaceLandmarksRequest()
  let handler=VNImageRequestHandler(url:url,options:[:]);try handler.perform([request])
  guard let source=CGImageSourceCreateWithURL(url as CFURL,nil),let props=CGImageSourceCopyPropertiesAtIndex(source,0,nil) as? [CFString:Any],
    let w=props[kCGImagePropertyPixelWidth] as? Int,let h=props[kCGImagePropertyPixelHeight] as? Int else {throw NSError(domain:"image",code:1)}
  let faces=request.results ?? []
  guard faces.count==1,let face=faces.first,let landmarks=face.landmarks else {rows.append(["file":file,"status":"needs-face-review","faces":faces.count]);continue}
  func points(_ region:VNFaceLandmarkRegion2D?)->[[Double]] {
   guard let region=region else{return []}
   return region.normalizedPoints.map {p in [Double(face.boundingBox.minX+CGFloat(p.x)*face.boundingBox.width)*Double(w),(1-Double(face.boundingBox.minY+CGFloat(p.y)*face.boundingBox.height))*Double(h)]}
  }
  rows.append(["file":file,"status":"localized-not-reviewed","width":w,"height":h,"confidence":face.confidence,
   "face":[Double(face.boundingBox.minX)*Double(w),(1-Double(face.boundingBox.maxY))*Double(h),Double(face.boundingBox.width)*Double(w),Double(face.boundingBox.height)*Double(h)],
   "leftPupil":points(landmarks.leftPupil),"rightPupil":points(landmarks.rightPupil),"leftEye":points(landmarks.leftEye),"rightEye":points(landmarks.rightEye)])
 } catch {rows.append(["file":file,"status":"localization-failed"])}
}
let encoded=try JSONSerialization.data(withJSONObject:rows,options:[.sortedKeys])
try encoded.write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
print("Localized \(rows.count) files; review required")
