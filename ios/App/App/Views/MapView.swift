import SwiftUI

struct MapView: View {
    @State private var showMenu = false
    
    let markers: [MarkerData] = [
        MarkerData(number: "1", position: CGPoint(x: 93, y: 193)),
        MarkerData(number: "4", position: CGPoint(x: 279, y: 183)),
        MarkerData(number: "6", position: CGPoint(x: 334, y: 237)),
        MarkerData(number: "1", position: CGPoint(x: 322, y: 333)),
        MarkerData(number: "1", position: CGPoint(x: 335, y: 405)),
        MarkerData(number: "3", position: CGPoint(x: 224, y: 461)),
        MarkerData(number: "4", position: CGPoint(x: 244, y: 478))
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                mapBackground
                
                markerOverlay
                
                VStack {
                    Spacer()
                    bottomSheet
                }
            }
            .ignoresSafeArea(edges: .bottom)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("GSRC81 MAPS")
                        .font(.custom("Poppins-Bold", size: 17))
                        .foregroundColor(.black)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    HStack(spacing: 16) {
                        Button(action: { showMenu.toggle() }) {
                            Text("MENU")
                                .font(.custom("Poppins-Regular", size: 10))
                                .foregroundColor(.black)
                        }
                        
                        CompassButton()
                    }
                }
            }
        }
    }
    
    private var mapBackground: some View {
        GeometryReader { geometry in
            ZStack {
                AsyncImage(url: URL(string: "https://api.builder.io/api/v1/image/assets/TEMP/f7b975e5a74df2353ed7be92c69a360c5330edf4?width=1150")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Color(red: 0.85, green: 0.85, blue: 0.85)
                }
                
                Color(red: 0.85, green: 0.84, blue: 0.83)
                    .opacity(0.4)
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
        }
    }
    
    private var markerOverlay: some View {
        GeometryReader { geometry in
            ForEach(markers) { marker in
                MapMarker(number: marker.number)
                    .position(
                        x: marker.position.x * (geometry.size.width / 390),
                        y: marker.position.y * (geometry.size.height / 844)
                    )
            }
        }
    }
    
    private var bottomSheet: some View {
        VStack(spacing: 0) {
            handleBar
            
            Spacer()
        }
        .frame(maxWidth: .infinity)
        .frame(height: 320)
        .background(Color(red: 0.92, green: 0.91, blue: 0.89))
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
    
    private var handleBar: some View {
        RoundedRectangle(cornerRadius: 2.5)
            .fill(Color.gray.opacity(0.3))
            .frame(width: 40, height: 5)
            .padding(.top, 8)
    }
}

struct MarkerData: Identifiable {
    let id = UUID()
    let number: String
    let position: CGPoint
}

#Preview {
    MapView()
}
