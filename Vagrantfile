# vim:ft=ruby

ENV['VAGRANT_DEFAULT_PROVIDER'] = 'vmware_fusion'


Vagrant.configure("2") do |config|
 	config.vm.box_url = 'http://files.vagrantup.com/precise32.box'
	config.vm.box = "precise32"
	config.vm.host_name = "portia"
	config.vm.provision :shell, :path => 'provision.sh'
	config.vm.network "private_network", ip: "33.33.33.10"
	config.vm.network "forwarded_port", guest: 8000, host: 8000
	config.ssh.forward_agent = true
	
	config.vm.provider "virtualbox" do |v, override|
    		v.customize ["modifyvm", :id, "--rtcuseutc", "on"]
    		v.customize ["modifyvm", :id, "--cpuexecutioncap", "90"]
    		v.customize ["modifyvm", :id, "--memory", "512"]
    		v.customize ["modifyvm", :id, "--cpus", 12]
  	end

	config.vm.provider :vmware_fusion do |v, override|
		v.vmx["memsize"] = "512"
		v.vmx["numvcpus"] = "1"
		override.vm.box = "precise64_vmware_fusion"
		override.vm.box_url = "http://files.vagrantup.com/precise64_vmware_fusion.box"
	end
end

